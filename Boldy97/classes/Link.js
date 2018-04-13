'use strict'

const Move = require('../classes/Move');

module.exports = class Link {

	constructor(from,to,turns){
		this.from = from;
		this.to = to;
		this.turns = turns;
		this.distance = turns*turns;
	}

	toMove(ships){
		return new Move(0,this.from,this.to,this.from.player,ships,this.turns);
	}

	toOutputMove(ships){
		return {
			origin: this.from.name,
			destination: this.to.name,
			ship_count: ships,
			turns: this.turns,
		};
	}

}