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

	// gets the score assigned to this move, should it succeed
	// gets the score assigned to this move, should it succeed
	// abused by BotElite. Sorry not sorry
	// this.id is the delay in turns times 1 million, plus the amount of extra ships sent than needed initially
	// (resulting shipcount on arrival is this.id%1000000+1)
	// START
	// 0: this.from.ships -> 0 -> ?
	// LEAVE
	// delay: this.from.ships+delay -> this.ships -> ?
	// ARRIVE
	// delay+this.turns: this.from.ships+delay-this.ships+this.turns -> 0 -> remainingships
	// NORMALISED
	// 0: this.from.ships-this.ships -> 0 -> remainingships-delay-this.turns
	// TOTAL
	// this.from.ships+remainingships-this.ships-delay-this.turns
	
	getScore(){
		let delay = Math.floor(this.id/1000000);
		let remainingships = this.id%1000000+1;
		return this.from.ships+remainingships-this.ships-delay-this.turns;
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