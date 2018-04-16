'use strict'

const Bot = require('./Bot');
const StateRouted = require('../classes/StateRouted');
const MessagePressureGlobal = require('../classes/messages/MessagePressureGlobal');
const MessagePressureLocal = require('../classes/messages/MessagePressureLocal');
const MessageRequestActive = require('../classes/messages/MessageRequestActive');
const MessageRequestPassive = require('../classes/messages/MessageRequestPassive');
const Utils = require('../classes/Utils');

const MINMOVEPART = 1/2;
const DUMPMOVEPART = 1;

module.exports = class BotHard extends Bot {

	// Does stuff

	constructor(ownername,neutralname){
		super(StateRouted,ownername,neutralname);
	}

	processData(data){
		super.processData(data);

		if(!this.state.routingMade)
			return;

		this.doMessages();
	}

	getMoves(){
		let moves = [];

		if(!this.state.routingMade)
			return moves;

		this.state.planets.filter(planet => planet.player.type === Utils.TYPES.ALLIED).forEach(planet => {
				// if all ships reserved, do nothing
			if(planet.getValue(MessageRequestPassive)[0] >= planet.ships)
				return;
			// if requesting, do nothing
			if(planet.getValue(MessageRequestActive)[0] !== 0)
				return;
			// get and do the move
			this.moveForPlanet(moves,planet);
		});

		return moves.map(move => move.toOutputMove());
	}

	doMessages(){
		this.state.planets.forEach(planet => {
			planet.addMessage(MessagePressureLocal.get(planet));
			planet.addMessage(MessagePressureGlobal.get(planet));
			planet.addMessage(MessageRequestPassive.get(planet));
		});

		this.state.planets.forEach(planet => {
			planet.processMessages();
		});

		this.state.planets.forEach(planet => {
			planet.addMessage(MessageRequestActive.get(planet));
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
		// send reinforcements
		if(this.tryAddMove(moves,this.getMoveReinforcement(planet)))
			return;

		// try to take over another planet
		if(this.tryAddMove(moves,this.getMoveConquest(planet)))
			return;
		
		// dump excess ships
		if(this.tryAddMove(moves,this.getMoveDump(planet)))
			return;
	}

	// HARD: if trying to send more than available, limit
	// HARD: if trying to send less than the minimum move size, increase
	getBetterShipcountForPlanet(planet,ships){
		let reserved = planet.getValue(MessageRequestPassive)[0];
		let available = planet.ships;
		if(reserved > 0)
			available -= reserved;
		if(ships > available)
			ships = available;
		if(ships < available*MINMOVEPART)
			ships = Math.ceil(available*MINMOVEPART);
		return ships;
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
	getMoveConquest(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessagePressureLocal) > 0)
			return;
		let options = [];
		planet.links.filter(link => link.to.player.type !== Utils.TYPES.ALLIED).forEach(link => {
			let future = link.to.getFuture(link.turns);
			// if the amount of ships are enough to take over the planet
			let ships = planet.ships - planet.getValue(MessageRequestPassive)[0];
			ships = this.getBetterShipcountForPlanet(planet,ships);
			if(ships > future.ships)
				options.push(link.toMove(future.ships+1));
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

	// HARD: if surrounded by allies, dump to neighbour with highest global pressure
	getMoveDump(planet){
		// if pressure exerted here, do nothing
		if(planet.getValue(MessagePressureLocal) > 0)
			return;
		// if not surrounded by allies, do nothing
		for(let link of planet.links)
			if(link.to.getFuture(link.turns).player.type !== Utils.TYPES.ALLIED)
				return;
		// get link with highest pressure
		let link = planet.links.reduce((result,link) => {
			if(result === undefined)
				return link;
			if(link.to.getValue(MessagePressureGlobal) > result.to.getValue(MessagePressureGlobal))
				return link;
			return result;
		});
		// if lower pressure than here, do nothing
		if(link.to.getValue(MessagePressureGlobal) < planet.getValue(MessagePressureGlobal))
			return;
		// send part of ships
		let ships = Math.ceil(DUMPMOVEPART*(planet.ships - planet.getValue(MessageRequestPassive)[0]));
		if(ships > planet.ships)
			ships = planet.ships;
		return link.toMove(ships);
	}

}