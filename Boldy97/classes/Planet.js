'use strict'

const Future = require('./Future');
const Utilities = require('./Utilities');

module.exports = class Planet {

	constructor(state,basicplanet,player){
		this.state = state;
		this.name = basicplanet.name;
		this.x = basicplanet.x;
		this.y = basicplanet.y;
		this.ships = basicplanet.ship_count;
		this.player = player;
		this.moves = [];
		this.future = [];

		player.addPlanet(this);
	}

	addMove(move){
		this.moves.push(move);
	}

	sort(){
		this.moves.sort((a,b) => a.turns - b.turns);
	}

	getFuture(turns){
		if(turns > this.future.length)
			this.getFuture(turns-1);
		if(turns === this.future.length)
			this.future[turns] = new Future(this.state,this,this.future[turns-1],this.moves.filter(move => move.turns === turns));
		return this.future[turns];
	}

	getDistance(planet){
		return (this.x-planet.x)*(this.x-planet.x)+(this.y-planet.y)*(this.y-planet.y);
	}

	getRealDistance(planet){
		return Math.ceil(Math.sqrt(this.getDistance(planet)));
	}

}