'use strict'

const Utilities = require('./Utilities');

module.exports = class BotHard {

	/*
	* try to defend a planet if you can (support from neighbours)
		* if you cant, ignore attack and all ships are available
	* keep amount of armies to be safe from close attacks
		* per player : SUM(allied_ships) - SUM(hostile_ships) > 0 for closest FLOOR(SQRT(planetcount)) neighbours
	* with all available ships, do stuff
		* send support to a planet under attack
		* send support to planets close to the enemy
		* if neutrals nearby, take them over
			* with extra armies to sustain an attack from the closest FLOOR(SQRT(planetcount)) hostile neighbours
		* send the rest to nearby planets to weaken them
	*/
	static getMoves(state){
		state = Utilities.formatState(state);

		/*console.log(stateToString(state));
		crash();*/

		/*for(let planet of state.planets)
			getFutureState(planet,100);*/

		return [];
	}

}