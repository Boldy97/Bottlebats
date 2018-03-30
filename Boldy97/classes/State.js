'use strict'

const Utilities = require('./Utilities');
const Player = require('./Player');
const Planet = require('./Planet');
const Move = require('./Move');

module.exports = class State {

	constructor(ownername,neutralname,basicstate){
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.players = [new Player(this,neutralname)];
		this.planets = [];
		this.moves = [];
		//this.planetsByType = Utilities.TYPES.reduce((acc,val) => Object.assign(acc,{[val]:[]}),{}); // TODO Necessary?

		// Players
		basicstate.planets.map(basicplanet => basicplanet.owner).concat(
			basicstate.expeditions.map(basicmove => basicmove.owner)
		).forEach(playername => {
			if(this.players.every(player => player.name !== playername))
				this.players.push(new Player(this,playername));
		});

		// Planets
		basicstate.planets.forEach(basicplanet => {
			this.planets.push(new Planet(
				this,
				basicplanet,
				this.players.find(player => player.name === basicplanet.owner),
			));
		});

		// Moves
		basicstate.expeditions.forEach(basicmove => {
			this.moves.push(new Move(
				this,
				basicmove,
				this.planets.find(planet => planet.name === basicmove.origin),
				this.planets.find(planet => planet.name === basicmove.destination),
				this.players.find(player => player.name === basicmove.owner),
			));
		});

		this.planets.forEach(planet => {
			planet.getFuture(10);
		});

		this.sort();
	}

	sort(){
		this.players.sort((a,b) => b.score - a.score);
		this.planets.sort((a,b) => a.name > b.name ? 1 : -1);
		this.moves.sort((a,b) => a.turns - b.ships);

		this.players.forEach(player => {
			player.sort();
		});
		this.planets.forEach(planet => {
			planet.sort();
		});
	}

	getNeutralPlayer(){
		return this.players.find(player => player.name === this.neutralname);
	}

}