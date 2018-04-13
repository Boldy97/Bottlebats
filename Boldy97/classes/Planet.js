'use strict'

module.exports = class Planet {

	constructor(Future,x,y,name,ships,player){
		this.Future = Future;
		this.x = x;
		this.y = y;
		this.name = name;
		this.ships = 0;
		this.player = undefined;
		this.moves_in = [];
		this.moves_out = [];
		this.future = [];
		this.links = [];

		this.setShips(ships);
		this.setPlayer(player);
		player.state.planets.forEach(planet => this.addLink(planet));
	}

	getDistance(planet){
		return (this.x-planet.x)*(this.x-planet.x)+(this.y-planet.y)*(this.y-planet.y);
	}

	getRealDistance(planet){
		return Math.ceil(Math.sqrt(this.getDistance(planet)));
	}

	getFuture(turns){
		if(turns > this.future.length)
			this.getFuture(turns-1);
		if(turns === this.future.length)
			this.future[turns] = new this.Future(this,this.future[turns-1],this.moves_in.filter(move => move.turns === turns));
		return this.future[turns];
	}

	getLink(planet){
		return this.links.find(link => link.to === planet);
	}

	setShips(ships){
		//check
		if(this.ships === ships)
			return;
		//this
		this.ships = ships;
		//remove
		//add
	}

	setPlayer(player){
		//check
		if(this.player === player)
			return;
		//this
		let oldplayer = this.player;
		this.player = player;
		//remove
		if(oldplayer !== undefined)
			oldplayer.removePlanet(this);
		//add
		if(player !== undefined)
			player.addPlanet(this);
	}

	addMove(move){
		if(move.to === this){
			//check
			if(this.moves_in.indexOf(move) !== -1)
				return;
			//this
			this.moves_in.push(move);
			this.removeFuture(move.turns);
			//remove
			//add
		}
		if(move.from === this){
			//check
			if(this.moves_out.indexOf(move) !== -1)
				return;
			//this
			this.moves_out.push(move);
			this.setShips(this.ships - move.ships);
			this.removeFuture(0);
			//remove
			//add
		}
	}

	addLink(planet,turns){
		if(this.getLink(planet))
			return;
		turns = turns || this.getRealDistance(planet);
		this.links.push(new this.player.state.Link(
			this,
			planet,
			turns,
		));
		planet.addLink(this,turns);
	}

	removeMove(move){
		//check
		let index = this.moves_in.indexOf(move);
		if(index !== -1){
			//this
			this.moves_in.splice(index,1);
			//remove
			move.remove();
			//add
		}
		//check
		index = this.moves_out.indexOf(move);
		if(index !== -1){
			//this
			this.moves_out.splice(index,1);
			//remove
			move.remove();
			//add
		}
	}

	removeFuture(turns){
		//check
		if(turns >= this.future.length)
			return;
		//this
		this.future.length = turns;
		//remove
		//add
	}

	processTurn(){
		//check
		//this
		let future = this.getFuture(1);
		this.setPlayer(future.player);
		this.setShips(future.ships);
		//remove
		this.future.splice(0,1);
		this.reserved = undefined;
		//add
	}

}