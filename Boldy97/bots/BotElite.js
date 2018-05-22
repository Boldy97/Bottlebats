'use strict'

const Bot = require('./Bot');
const Future = require('../classes/Future');
const StateRouted = require('../classes/StateRouted');
const MessageFertility = require('../classes/messages/MessageFertility');
const MessagePressureGlobal = require('../classes/messages/MessagePressureGlobal');
const MessagePressureLocal = require('../classes/messages/MessagePressureLocal');
const MessageRequestActive = require('../classes/messages/MessageRequestActive');
const MessageRequestPassive = require('../classes/messages/MessageRequestPassive');
const MessageStatusGame = require('../classes/messages/MessageStatusGame');
const MessageStatusScores = require('../classes/messages/MessageStatusScores');
const MessageStatusWinning = require('../classes/messages/MessageStatusWinning');
const Move = require('../classes/Move');
//const Timer = require('../classes/Timer');
const Utils = require('../classes/Utils');

const MINMOVEPART = 1/2; // the minimum part of the ships to be moved each move
const DUMPMOVEPART = 1; // what part of the ships will be dumped
const DUMPDISTMULT = 3; // how far you will look to dump on hostile planets
const TURNLIMIT = 500; // howmany turns the game will last (not necessary but useful to ensure draws)

module.exports = class BotElite extends Bot {

	// Same as hard, but with extras
	// 1: tries to get a better startposition if needed
	// 2: maximize future prospected return on conquest (only advantageous on random neutral starting shipcount)
	// 3: knows the state of the game (early/mid/late)
	// --> when early, dont use MINMOVEPART
	// 4: now knows when winning or losing, and changes certain tactics accordingly
	// --> when winning hard, dumps extra ships on hostile planets
	// --> when losing hard, flee from all danger and try to prolong the loss
	// 5: does winstatus/gamestatus combined tactics
	// --> if winning and lategame, also dumps. avoids draws when not having a solid lead
	// 6: better future state evaluation on conquest. allows delaying an attack for planet sniping

	constructor(ownername,neutralname){
		super(StateRouted,ownername,neutralname);
		this.preferredStartPlanet = null;
	}

	processData(data){
		super.processData(data);

		if(!this.state.routingMade)
			return;

		this.doMessages();

		if(this.state.turn === 1){
			// decide if should change startpositions
			let addPreferredStartPlanet = false;
			let fertility = this.state.getPlayer(this.state.ownername).planets.reduce((fertility,planet) => {
				return fertility+planet.getValue(MessageFertility);
			},0);
			let hostiles = this.state.players.filter(player => player.type === Utils.TYPES.HOSTILE)
			for(let hostile of hostiles){
				let hostilefertility = hostile.planets.reduce((fertility,planet) => {
					return fertility+planet.getValue(MessageFertility);
				},0);
				if(hostilefertility >= fertility){
					addPreferredStartPlanet = true;
					break;
				}
			}
			// if changing, get best option
			if(addPreferredStartPlanet){
				let planet = this.state.planets.filter(planet => planet.player.type === Utils.TYPES.NEUTRAL).reduce((best,planet) => {
					if(best === null)
						return planet;
					if(planet.getValue(MessageFertility) > best.getValue(MessageFertility))
						return planet;
					return best;
				},null);
				this.preferredStartPlanet = planet;
			}
		}

	}

	getMoves(){
		//Timer.start();
		let moves = [];

		if(!this.state.routingMade)
			return moves;

		this.state.planets.filter(planet => planet.player.type === Utils.TYPES.ALLIED).forEach(planet => {
			// if not losing hard, check some stuff
			if(planet.getValue(MessageStatusWinning) !== Utils.WINSTATUS.LOSING_HARD){
				// if no ships available, do nothing
				if(planet.getValue(MessageRequestPassive)[0] >= planet.ships)
					return;
				// if requesting, do nothing
				if(planet.getValue(MessageRequestActive)[0] !== 0)
					return;
			}
			// get and do the move
			this.moveForPlanet(moves,planet);
		});

		//Timer.stop();
		return moves.map(move => move.toOutputMove());
	}

	doMessages(){
		this.state.planets.forEach(planet => {
			if(this.state.turn === 1)
				planet.addMessage(MessageFertility.get(planet));
			planet.addMessage(MessagePressureLocal.get(planet));
			planet.addMessage(MessagePressureGlobal.get(planet));
			planet.addMessage(MessageRequestPassive.get(planet));
			planet.addMessage(MessageStatusGame.get(planet));
			planet.addMessage(MessageStatusScores.get(planet));
		});

		this.state.planets.forEach(planet => {
			planet.processMessages();
		});

		this.state.planets.forEach(planet => {
			planet.addMessage(MessageRequestActive.get(planet));
			planet.addMessage(MessageStatusWinning.get(planet));
		});

		this.state.planets.forEach(planet => {
			planet.processMessages();
		});
	}

	tryAddMove(moves,move){
		if(move === undefined)
			return false;
		// push
		moves.push(move);
		// update requested
		let requested = move.to.getValue(MessageRequestActive);
		if(requested.length > move.turns){
			// decrease previous turn requests
			for(let i=0;i<=move.turns;i++)
				requested[i] -= move.ships;
			// level off next turn requests
			for(let i=move.turns;i<requested.length && requested[i]>requested[move.turns]-move.ships;i++)
				requested[i] = requested[move.turns]-move.ships;
			// remove excess requests
			for(let i=requested.length-1;i>0 && requested[i]<=0;i--)
				requested.pop();
		}
		return true;
	}

	moveForPlanet(moves,planet){
		//
		if(planet.getValue(MessageStatusWinning) === Utils.WINSTATUS.LOSING_HARD){
			this.tryAddMove(moves,this.getMoveFlee(planet));
			return;
		}
		// better start position at the start
		if(this.preferredStartPlanet !== null){
			// take it if you can
			let distance = planet.getRealDistance(this.preferredStartPlanet)
			let future = this.preferredStartPlanet.getFuture(distance);
			if(planet.ships > future.ships){
				let move = new Move(0,planet,this.preferredStartPlanet,planet.player,planet.ships,distance);
				this.tryAddMove(moves,move);
				this.preferredStartPlanet = null;
				return;
			}
		}

		// send reinforcements
		if(this.tryAddMove(moves,this.getMoveReinforcement(planet)))
			return;

		// try to take over another planet
		if(this.tryAddMove(moves,this.getMoveConquest(planet)))
			return;
		
		// dump excess ships
		if(this.tryAddMove(moves,this.getMoveDump(planet)))
			return;

		return;
	}

	// HARD: if trying to send more than available, limit
	// HARD: if trying to send less than the minimum move size, increase
	// ELITE: if earlygame, dont use MINMOVEPART
	getBetterShipcountForPlanet(planet,ships,delay = 0){
		let reserved = planet.getValue(MessageRequestPassive)[delay];
		let available = planet.ships+delay;
		if(reserved > 0)
			available -= reserved;
		if(ships > available)
			ships = available;
		if(planet.getValue(MessageStatusGame) !== Utils.GAMESTATUS.EARLY && ships < available*MINMOVEPART)
			ships = Math.ceil(available*MINMOVEPART);
		return ships;
	}

	getNeededExtraShips(planet,turns){
		let result = planet.getValue(MessageRequestPassive)[turns];
		if(result === undefined || result < 0)
			result = 0;
		return result;
	}

	// HARD: if allied link requesting, send ships
	// HARD: if allied link has higher local pressure, send ships there
	getMoveReinforcement(planet){
		// get allied links
		let links = planet.links.filter(link => link.to.player.type === Utils.TYPES.ALLIED);
		// for each link that is requesting armies that are able to be delivered on time
		for(let link of links){
			let requested = link.to.getValue(MessageRequestActive);
			if(link.turns >= requested.length)
				continue;
			// calculate shipcount
			let ships = requested[link.turns];
			return link.toMove(this.getBetterShipcountForPlanet(planet,ships));
		}

		// for each link that has a higher positive local pressure than the current planet
		let pressurelocalhere = planet.getValue(MessagePressureLocal);
		for(let link of links){
			let pressurelocal = link.to.getValue(MessagePressureLocal);
			if(pressurelocal <= 0)
				continue;
			if(pressurelocalhere > pressurelocal)
				continue;
			let ships = link.to.getValue(MessagePressureLocal);
			return link.toMove(this.getBetterShipcountForPlanet(planet,ships));
		}
	}

	// HARD: if no local pressure and unallied planets nearby, take them if you can
	// ELITE: optimised option generation and choice - will delay if worth it - planet sniping
	getMoveConquest(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessagePressureLocal) > 0)
			return;
		let options = [];
		planet.links.filter(link => link.to.player.type !== Utils.TYPES.ALLIED).forEach(link => {
			// get future when you are supposed to arrive
			let future = link.to.getFuture(link.turns);
			// if it will be my planet, its not a conquest
			if(future.player === planet.player)
				return;
			// calculate the amount of ships needed to defend this planet
			let extraships = this.getNeededExtraShips(link.to,link.turns);
			// calculate fighting ship count
			let previousfuture = link.to.getFuture(link.turns-1);
			let fightingships = future.armies[0].ships;
			// calculate the amount of ships needed to take this planet
			let needed = fightingships+1+extraships;
			let ships = this.getBetterShipcountForPlanet(planet,needed);
			// make the default option (if ships is higher, take that)
			let option = link.toMove(Math.max(needed,ships));
			// look for a better option in the future
			for(let move of link.to.moves_in.filter(move => move.turns >= link.turns)){
				// check if its better to send an attack that arrives on move.turns+1
				let future2 = move.to.getFuture(move.turns+1);
				let delay = move.turns+1-link.turns;
				let extraships = this.getNeededExtraShips(move.to,move.turns+1);
				let needed2 = future2.ships+1+extraships;
				let ships2 = this.getBetterShipcountForPlanet(move.to,needed2,delay);
				if(ships2 < needed2)
					continue;
				let option2 = link.toMove(ships2);
				option2.id = 1000000*delay+extraships;

				if(option2.getScore() > option.getScore()){
					needed = needed2;
					ships = ships2;
					option = option2;
				}
			}
			// if a valid move
			if(ships >= needed)
				options.push(option);
		});
		let option = options.reduce((result,option) => {
			if(result === undefined)
				return option;
			//if(option.turns+2*option.ships < result.turns+2*result.ships)
			if(option.getScore() > result.getScore())
				return option;
			return result;
		},undefined);
		// if best option is to delay, do nothing
		if(option !== undefined && option.id !== 0)
			return;
		return option;
	}

	// HARD: if surrounded by allies, dump to neighbour with highest global pressure
	// ELITE: if winning, dump on random enemy planet
	getMoveDump(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessagePressureLocal) > 0)
			return;
		// if not surrounded by allies, do nothing
		for(let link of planet.links)
			if(link.to.getFuture(link.turns).player.type !== Utils.TYPES.ALLIED)
				return;
		//decide on target based on win and game status
		let winstatus = planet.getValue(MessageStatusWinning);
		let gamestatus = planet.getValue(MessageStatusGame);
		let target = undefined;
		let minlinkturns = planet.links.reduce((min,link) => {
			return link.turns < min ? link.turns : min;
		},Infinity);
		// winning hard/winning lategame - enemy planet with most ships
		if(winstatus === Utils.WINSTATUS.WINNING_HARD || (winstatus === Utils.WINSTATUS.WINNING && gamestatus === Utils.GAMESTATUS.LATE)){
			target = planet.player.state.planets
				.filter(planet2 => planet2.player.type === Utils.TYPES.HOSTILE)
				.filter(planet2 => planet2.getRealDistance(planet) < DUMPDISTMULT*minlinkturns)
				.reduce((target,planet) => {
					if(target === undefined)
						return planet;
					if(planet.ships > target.ships)
						return planet;
					return target;
				},undefined);
		}
		// winning/equal/losing/no target found - neighbour under most pressure
		if(target === undefined){
			target = planet.links.reduce((result,link) => {
				if(result === undefined)
					return link;
				if(link.to.getValue(MessagePressureGlobal) > result.to.getValue(MessagePressureGlobal))
					return link;
				return result;
			}).to;
			// if lower pressure than here, do nothing
			if(target.getValue(MessagePressureGlobal) < planet.getValue(MessagePressureGlobal))
				return;
		}
		// send part of ships
		let ships = Math.ceil(DUMPMOVEPART*planet.ships);
		ships = this.getBetterShipcountForPlanet(planet,ships);
		return new Move(0,planet,target,planet.player,ships,planet.getRealDistance(target));
	}

	getMoveFlee(planet){
		// if no hostile attacks next turn, do nothing
		if(planet.moves_in.filter(move => move.turns === 1).every(move => move.player.type !== Utils.TYPES.HOSTILE))
			return;
		// if planet found that, when the move arrives, the game is over, do it!
		let maxdist = 0;
		let maxdistplanet = null;
		planet.player.state.planets.forEach(planet2 => {
			let dist = planet.getRealDistance(planet2);
			if(dist > maxdist){
				maxdist = dist;
				maxdistplanet = planet2;
			}
		});
		if(planet.player.state.turn + maxdist > TURNLIMIT)
			return new Move(0,planet,maxdistplanet,planet.player,planet.ships,maxdist);
		// flee to the link with the least pressure
		return planet.links.reduce((result,link) => {
			if(result === undefined)
				return link;
			if(link.to.getValue(MessagePressureLocal) < result.to.getValue(MessagePressureLocal))
				return link;
			return result;	
		}).toMove(planet.ships);
	}

}