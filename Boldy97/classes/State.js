'use strict'

const Utils = require('./Utils');

module.exports = class State {

	constructor(Player,Planet,Move,Future,Link,ownername,neutralname){
		this.Player = Player;
		this.Planet = Planet;
		this.Move = Move;
		this.Future = Future;
		this.Link = Link;
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.turn = 0;
		this.players = [];
		this.planets = [];
		this.moves = [];

		this.addPlayer(neutralname);
	}

	getPlayerTypeFromName(name){
		return name===this.ownername?Utils.TYPES.ALLIED:name===this.neutralname?Utils.TYPES.NEUTRAL:Utils.TYPES.HOSTILE;
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

	toJSON(){
		let result = {planets:[],expeditions:[]};
		for(let planet of this.planets)
			result.planets.push({x:planet.x,y:planet.y,name:planet.name,ship_count:planet.ships,owner:planet.player.name});
		for(let move of this.moves)
			result.expeditions.push({id:move.id,origin:move.from.name,destination:move.to.name,owner:move.player.name,ship_count:move.ships,turns_remaining:move.turns});
		return JSON.stringify(result);
	}

	addPlayer(name){
		let player = this.getPlayer(name);
		if(player !== undefined)
			return player;
		player = new this.Player(this,name,this.getPlayerTypeFromName(name));

		this.players.push(player);

		return player;
	}

	addPlanet(x,y,name,ships,player){
		let planet = this.getPlanet(name);
		if(planet !== undefined)
			return planet;
		planet = new this.Planet(this.Future,x,y,name,ships,player);

		this.planets.push(planet);
		player.addPlanet(planet);

		return planet;
	}

	addMove(id,from,to,player,ships,turns){
		let move = this.getMove(id);
		if(move !== undefined)
			return move;
		move = new this.Move(id,from,to,player,ships,turns);

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
		this.turn++;
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

		if(!(new Error().stack.includes('BotDead'))) this.check(data);
	}

	check(data){ // TODO remove

		if(data.expeditions.length !== this.moves.length){
			throw this.turn+' moves size mismatch. is '+this.moves.length+' should be '+data.expeditions.length;
		}
		for(let move of data.expeditions){
			let move2 = this.getMove(move.id);
			if(move2 === undefined)
				throw this.turn+' no id '+move.id;
		}
		if(data.planets.length !== this.planets.length)
			throw this.turn+' planets size mismatch';
		for(let planet of data.planets){
			let planet2 = this.getPlanet(planet.name);
			if(planet2 === undefined)
				throw this.turn+' no planet '+planet.name;
			if(planet.owner !== planet2.player.name){
				//throw `${this.turn} player mismatch @ ${planet2.name} is ${planet2.player.name} should be ${planet.owner}`;
				planet2.setPlayer(this.getPlayer(planet.owner));
			}
			if(planet.ship_count !== planet2.ships){
				//throw new Error(`${this.turn} ships mismatch @ ${planet2.name} is ${planet2.ships} should be ${planet.ship_count}`);
				planet2.setShips(planet.ship_count);
			}
		}
	}

}