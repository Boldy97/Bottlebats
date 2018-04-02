'use strict'

const Bot = require('./Bot');
const {State, TYPE_NEUTRAL, TYPE_ALLIED, TYPE_HOSTILE} = require('../classes/State');

module.exports = class BotSimple extends Bot {

	// Attacks with all planets to the nearest not-owned planet

	constructor(ownername,neutralname){
		super(State,ownername,neutralname);
	}

	getMoves(){
		let moves = [];

		this.state.planets.filter(planet => planet.player.type === TYPE_ALLIED).forEach(planet => {
			let to = this.state.planets.filter(planet2 => planet2.player.type !== TYPE_ALLIED).reduce((result,planet2) => {
				if(planet.getDistance(planet2) < result.distance)
					result.distance = planet.getDistance(result.to = planet2);
				return result;
			},{to:undefined,distance:Infinity}).to;
			if(to !== undefined)
				moves.push({
					origin: planet.name,
					destination: to.name,
					ship_count: planet.ships,
				});
		});

		return moves;
	}

}