'use strict'

const Utils = require('../classes/Utils');

module.exports = class Player {

	constructor(state,name,type){
		this.state = state;
		this.name = name;
		this.type = type;
		this.planets = [];
		this.moves = [];
	}

	getShipIncrement(){
		return this.type===Utils.TYPES.NEUTRAL?0:1;
	}

	addPlanet(planet){
		//check
		if(this.planets.indexOf(planet) !== -1)
			return;
		//this
		this.planets.push(planet);
		//remove
		//add
		planet.setPlayer(this);
	}

	addMove(move){
		//check
		if(this.moves.indexOf(move) !== -1)
			return;
		//this
		this.moves.push(move);
		//remove
		//add
	}

	removePlanet(planet){
		//check
		let index = this.planets.indexOf(planet);
		if(index === -1)
			return;
		//this
		this.planets.splice(index,1);
		//remove
		planet.setPlayer(undefined);
		//add
	}

	removeMove(move){
		//check
		let index = this.moves.indexOf(move);
		if(index === -1)
			return;
		//this
		this.moves.splice(index,1);
		//remove
		move.remove();
		//add
	}

}