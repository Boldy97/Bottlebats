'use strict'

module.exports = class Move {

	constructor(state,basicmove,from,to,player){
		this.state = state;
		this.from = from;
		this.to = to;
		this.ships = basicmove.ship_count;
		this.turns = basicmove.turns_remaining;
		this.player = player;

		to.addMove(this);
		player.addMove(this);
	}

}