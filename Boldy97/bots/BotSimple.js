'use strict'

const Utilities = require('./Utilities');

module.exports = class BotSimple {

	// Attacks with all planets to the nearest not-owned planet
	static getMoves(state){
		let moves = [];
		//For all planets that are mine
		for(let origin of state.planets){
			if(origin.owner !== 1)
				continue;
			//For all planets that are not mine
			let destination,dist = Infinity;
			for(let temp_destination of state.planets){
				if(temp_destination.owner === 1)
					continue;
				let temp_dist = Utilities.getDistanceBetweenPlanets(origin,temp_destination);
				if(temp_dist < dist){
					destination = temp_destination
					dist = temp_dist;
				}
			}
			if(destination === undefined)
				continue;
			moves.push({
				origin: origin.name,
				destination: destination.name,
				ship_count: origin.ship_count,
			});
		}
		return moves;
	}

}