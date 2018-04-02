'use strict'

//const RoutedState = require('./RoutedState');
const Bot = require('./Bot');
const {State, TYPE_NEUTRAL, TYPE_ALLIED, TYPE_HOSTILE} = require('../classes/State');

module.exports = class BotHard extends Bot {

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

	constructor(ownername,neutralname){
		super(State,ownername,neutralname);
	}

	getMoves(){
		return [];
	}

}