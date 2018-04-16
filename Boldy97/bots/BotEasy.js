'use strict'

const Bot = require('./Bot');
const StateBasic = require('../classes/StateBasic');
const Utils = require('../classes/Utils');

module.exports = class BotEasy extends Bot {

	// Attacks with all planets to the nearest not-owned planet

	constructor(ownername,neutralname){
		super(StateBasic,ownername,neutralname);
	}

	getMoves(){
		let moves = [];

		this.state.planets.filter(planet => planet.player.type === Utils.TYPES.ALLIED).forEach(planet => {
			let link = planet.links.filter(link => link.to.player.type !== Utils.TYPES.ALLIED).reduce((result,link) => {
				if(link.turns < result.turns)
					result = link;
				return result;
			},{turns:Infinity});
			if(link.turns !== Infinity)
				moves.push(link.toOutputMove(planet.ships));
		});

		return moves;
	}

}