'use strict'

const Utilities = require('./Utilities');

module.exports = class Player {

	constructor(state,name){
		this.state = state;
		this.name = name;
		this.type = Utilities.getPlayerTypeFromName(name);
		this.score = 0;
		this.planets = [];
		this.moves = [];
	}

	addPlanet(planet){
		this.score += planet.ships;
		this.planets.push(planet);
	}

	addMove(move){
		this.score += move.ships;
		this.moves.push(move);
	}

	sort(){
		this.moves.sort((a,b) => a.turns - b.turns);
	}

	getShipIncrement(){
		return this.type===Utilities.TYPE_NEUTRAL?0:1;
	}

}