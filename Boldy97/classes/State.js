'use strict'

const Player = require('./Player');
const Planet = require('./Planet');
const Move = require('./Move');

exports.TYPE_NEUTRAL = 'NEUTRAL';
exports.TYPE_ALLIED = 'ALLIED';
exports.TYPE_HOSTILE = 'HOSTILE';

exports.State = class State {

	constructor(ownername,neutralname){
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.players = [];
		this.planets = [];
		this.moves = [];
		this.TYPE_NEUTRAL = exports.TYPE_NEUTRAL;
		this.TYPE_ALLIED = exports.TYPE_ALLIED;
		this.TYPE_HOSTILE = exports.TYPE_HOSTILE;

		this.addPlayer(neutralname);
	}

	getPlayerTypeFromName(name){
		return name===this.ownername?exports.TYPE_ALLIED:name===this.neutralname?exports.TYPE_NEUTRAL:exports.TYPE_HOSTILE;
	}

	getPlayer(name){
		return this.players.find(player => player.name === name);
	}

	getPlanet(name){
		return this.planets.find(planet => planet.name === name);
	}

	getMove(id){
		return this.moves.find(move => move.id === id);
	}

	addPlayer(name){
		let player = this.getPlayer(name);
		if(player !== undefined)
			return player;
		player = new Player(this,name,this.getPlayerTypeFromName(name));

		this.players.push(player);

		return player;
	}

	addPlanet(x,y,name,ships,player){
		let planet = this.getPlanet(name);
		if(planet !== undefined)
			return planet;
		planet = new Planet(x,y,name,ships,player);

		this.planets.push(planet);
		player.addPlanet(planet);

		return planet;
	}

	addMove(id,from,to,player,ships,turns){
		let move = this.getMove(id);
		if(move !== undefined)
			return move;
		move = new Move(id,from,to,player,ships,turns);

		this.moves.push(move);
		player.addMove(move);
		from.addMove(move);
		to.addMove(move);

		return move;
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

	processTurn(){
		this.planets.forEach(planet => {
			planet.processTurn();
		});
		this.moves.slice(0).forEach(move => {
			move.processTurn();
		});
	}

	processData(data){
		// new players
		data.planets.map(planetdata => planetdata.owner).concat(
			data.expeditions.map(movedata => movedata.owner)
		).forEach(name => {
			this.addPlayer(name);
		});

		// new planets
		data.planets.forEach(planetdata => {
			let player = this.getPlayer(planetdata.owner);
			this.addPlanet(
				planetdata.x,
				planetdata.y,
				planetdata.name,
				planetdata.ship_count-player.getShipIncrement(),
				player,
			);
		});

		// new moves
		data.expeditions.forEach(movedata => {
			this.addMove(
				movedata.id,
				this.getPlanet(movedata.origin),
				this.getPlanet(movedata.destination),
				this.getPlayer(movedata.owner),
				movedata.ship_count,
				movedata.turns_remaining+1,
			);
		});

		this.processTurn();

		
		this.check(data);
	}

	check(data){ // TODO remove
		
		/*for(let planet of this.planets)
			console.log(`${planet.name} : player ${planet.player.name} - ${planet.ships} ships`);
		for(let move of this.moves)
			console.log(`${move.id} : ${move.from.name} -> ${move.to.name} - player ${move.player.name} - ${move.ships} ships - ${move.turns} turns`);
		console.log();*/

		if(data.expeditions.length !== this.moves.length){
			console.log(this.moves.length);
			console.log(this.moves);
			throw 'moves size mismatch. is '+this.moves.length+' should be '+data.expeditions.length;
		}
		for(let move of data.expeditions){
			let move2 = this.getMove(move.id);
			if(move2 === undefined)
				throw 'no id '+move.id;
		}
		if(data.planets.length !== this.planets.length)
			throw 'planets size mismatch';
		for(let planet of data.planets){
			let planet2 = this.getPlanet(planet.name);
			if(planet2 === undefined)
				throw 'no planet '+planet.name;
			if(planet.owner !== planet2.player.name)
				throw `player mismatch @ ${planet2.name} is ${planet2.player.name} should be ${planet.owner}`;
			if(planet.ship_count !== planet2.ships)
				throw `ships mismatch @ ${planet2.name} is ${planet2.ships} should be ${planet.ship_count} with owner ${planet2.player.name} and inc ${planet2.player.getShipIncrement()} and type ${planet2.player.type}`;
		}
	}

}