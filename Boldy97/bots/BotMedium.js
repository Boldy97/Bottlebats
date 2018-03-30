'use strict'

const Utilities = require('../classes/Utilities');

module.exports = class BotMedium {

	// Attacks with all planets to the nearest not-owned planet, and holds armies for planets under attack
	static getMoves(state){
		let moves = [];
		// For all planets that are mine
		for(let planet_mine of state.planets){
			if(planet_mine.owner !== 1)
				continue;
			// For all planets that are not mine
			let destination,dist = Infinity;
			for(let planet_enemy of state.planets){
				if(planet_enemy.owner === 1)
					continue;
				let temp_dist = Utilities.getDistance(planet_mine,planet_enemy);
				if(temp_dist < dist){
					destination = planet_enemy
					dist = temp_dist;
				}
			}
			if(destination === undefined)
				continue;
			// For all expeditions on the way to my planet
			let reserved_ships = 0;
			for(let expedition of state.expeditions){
				if(expedition.destination !== planet_mine.name)
					continue;
				reserved_ships = Math.max(reserved_ships,expedition.ship_count-expedition.turns_remaining+1);
			}
			// If going to lose, flee!
			if(reserved_ships > planet_mine.ship_count)
				reserved_ships = 0;
			// Add move
			moves.push({
				origin: planet_mine.name,
				destination: destination.name,
				ship_count: planet_mine.ship_count-reserved_ships,
			});
		}
		return moves;
	}

}