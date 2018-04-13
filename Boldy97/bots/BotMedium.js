'use strict'

const Bot = require('./Bot');
const StateBasic = require('../classes/StateBasic');
const Utils = require('../classes/Utils');

module.exports = class BotMedium extends Bot {

	// Attacks with all planets to the nearest not-owned planet, and holds armies for planets under attack

	constructor(ownername,neutralname){
		super(StateBasic,ownername,neutralname);
	}

	getMoves(){
		let moves = [];

		this.state.planets.filter(planet => planet.player.type === Utils.TYPES.ALLIED).forEach(planet => {
			let reserved = planet.moves_in.filter(move => move.player.type === Utils.TYPES.HOSTILE).reduce((reserved,move) => {
				return reserved = Math.max(reserved,move.ships-move.turns+1);
			},0);
			if(reserved >= planet.ships)
				return;
			let link = planet.links.filter(link => link.to.player.type !== Utils.TYPES.ALLIED).reduce((result,link) => {
				if(link.turns < result.turns)
					result = link;
				return result;
			},{turns:Infinity});
			if(link.turns !== Infinity)
				moves.push(link.toOutputMove(planet.ships-reserved));
		});

		return moves;
	}

}