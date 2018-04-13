'use strict'

const Bot = require('./Bot');
const StateRouted = require('../classes/StateRouted');
const MessageGlobalPressure = require('../classes/messages/MessageGlobalPressure');
const MessageLocalPressure = require('../classes/messages/MessageLocalPressure');
const MessageRequested = require('../classes/messages/MessageRequested');
const MessageReserved = require('../classes/messages/MessageReserved');
const Utils = require('../classes/Utils');

const MINMOVEPART = 1/2;
const DUMPMOVEPART = 1/2;

module.exports = class BotHard extends Bot {

	/*
	* try to defend a planet if you can (support from neighbours)
		* if you cant, ignore attack and all ships are available
	* keep amount of armies to be safe from close attacks
		* per player : SUM(allied_ships) - SUM(hostile_ships) > 0 for closest FLOOR(SQRT(planetcount)) neighbours
	* with all available ships, do stuff
		* send support to a planet under attack
		* send support to planets close to the enemy
		* if neutrals nearby, take them over
			* with extra armies to sustain an attack from the closest FLOOR(SQRT(planetcount)) hostile neighbours
		* send the rest to nearby planets to weaken them
	*/

	constructor(ownername,neutralname){
		super(StateRouted,ownername,neutralname);
	}

	processData(data){
		super.processData(data);

		this.state.planets.forEach(planet => {
			planet.addMessage(MessageLocalPressure.get(planet));
			planet.addMessage(MessageGlobalPressure.get(planet));
			planet.addMessage(MessageReserved.get(planet));
			planet.addMessage(MessageRequested.get(planet));
		});

		this.state.planets.forEach(planet => {
			planet.processMessages();
		});
	}

	getMoves(){
		let moves = [];

		this.state.planets.filter(planet => planet.player.type === Utils.TYPES.ALLIED).forEach(planet => {
			
			// if no ships available, do nothing
			if(planet.ships - planet.getValue(MessageReserved) <= 0)
				return;
			// if requesting, do nothing
			if(planet.getValue(MessageRequested)[0] !== 0)
				return;

			// send reinforcements
			if(this.tryAddMove(moves,this.getMoveReinforcement(planet)))
				return;

			// try to take over another planet
			if(this.tryAddMove(moves,this.getMoveConquest(planet)))
				return;
			
			// dump excess ships
			if(this.tryAddMove(moves,this.getMoveDump(planet)))
				return;

			// TODO more stuff
			// TODO make global pressure higher because turn growth gets counted multiple times

		});

		return moves.map(move => move.toOutputMove());
	}

	tryAddMove(moves,move){
		if(move === undefined)
			return false;
		// update requested
		let requested = move.to.getValue(MessageRequested);
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
		// TODO update local pressures?
		moves.push(move);
		return true;
	}

	// if allied link requesting, send ships
	// if allied link has higher local pressure, send ships there
	getMoveReinforcement(planet){
		// get allied links
		let links = planet.links.filter(link => link.to.player.type === Utils.TYPES.ALLIED);
		// for each link that is requesting armies that are able to be delivered on time
		for(let link of links){
			let requested = link.to.getValue(MessageRequested);
			if(link.turns >= requested.length)
				continue;
			// calculate shipcount
			let ships = requested[link.turns];
			let available = planet.ships - planet.getValue(MessageReserved);
			if(ships > available)
				ships = available;
			if(ships < available*MINMOVEPART)
				ships = Math.ceil(available*MINMOVEPART);
			return link.toMove(ships);
		}

		// for each link that has a higher positive local pressure than the current planet
		let pressurelocalhere = planet.getValue(MessageLocalPressure);
		for(let link of links){
			let pressurelocal = link.to.getValue(MessageLocalPressure);
			if(pressurelocal <= 0)
				continue;
			if(pressurelocalhere > pressurelocal)
				continue;
			let ships = link.to.getValue(MessageLocalPressure);
			let available = planet.ships - planet.getValue(MessageReserved);
			if(ships > available)
				ships = available;
			if(ships < available*MINMOVEPART)
				ships = Math.ceil(available*MINMOVEPART);
			return link.toMove(ships);
		}
	}

	// if no local pressure and unallied planets nearby, take them if you can
	getMoveConquest(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessageLocalPressure) > 0)
			return;
		let options = [];
		planet.links.filter(link => link.to.player.type !== Utils.TYPES.ALLIED).forEach(link => {
			let future = link.to.getFuture(link.turns);
			if(planet.ships - planet.getValue(MessageReserved) >= future.ships+1) // if the amount of ships are enough to take over the planet
				options.push(link.toMove(future.ships+1)); // TODO send more based on local pressure?
		});
		let option = options.reduce((result,option) => {
			if(result === undefined)
				return option;
			if(option.turns < result.turns)
				return option;
			return result;
		},undefined);
		return option;
	}

	// if surrounded by allies, dump to neighbour with highest global pressure
	getMoveDump(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessageLocalPressure) > 0)
			return;
		// if not surrounded by allies, do nothing
		for(let link of planet.links)
			if(link.to.getFuture(link.turns).player.type !== Utils.TYPES.ALLIED)
				return;
		// get link with highest pressure
		let link = planet.links.reduce((result,link) => {
			if(result === undefined)
				return link;
			if(link.to.getValue(MessageGlobalPressure) > result.to.getValue(MessageGlobalPressure))
				return link;
			return result;
		});
		// if lower pressure than here, do nothing
		if(link.to.getValue(MessageGlobalPressure) < planet.getValue(MessageGlobalPressure))
			return;
		// send part of ships
		let ships = Math.ceil(DUMPMOVEPART*(planet.ships - planet.getValue(MessageReserved)));
		return link.toMove(ships);
	}

}