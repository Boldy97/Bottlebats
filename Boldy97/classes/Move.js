'use strict'

module.exports = class Move {

	constructor(id,from,to,player,ships,turns){
		this.id = id;
		this.from = from;
		this.to = to;
		this.player = player;
		this.ships = ships;
		this.turns = turns;
	}

	toOutputMove(){
		return {
			origin: this.from.name,
			destination: this.to.name,
			ship_count: this.ships,
			turns: this.turns,
		};
	}

	remove(){
		//check
		//this
		//remove
		this.player.state.removeMove(this);
		this.player.removeMove(this);
		this.to.removeMove(this);
		this.from.removeMove(this);
		//add
	}

	processTurn(){
		this.turns--;
		if(this.turns < 1)
			this.remove();
	}

}