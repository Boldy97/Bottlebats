'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageStatusGame extends Message {

	static getRoutes(planet){
		return this.getRoutesNone(planet);
	}

	static getDefaultValue(){
		return Utils.GAMESTATUS.EARLY;
	}

	reduce(messages){
		return this.reduceFirst(messages);
	}

	// value = the current game status
	static get(planet){
		let total = planet.player.state.planets.length;
		let taken = planet.player.state.planets.reduce((count,planet) => count + (planet.player.type !== Utils.TYPES.NEUTRAL ? 1 : 0),0);

		if(taken*2 < total)
			return new this(undefined,planet,planet,Utils.GAMESTATUS.EARLY);
		if(taken < total)
			return new this(undefined,planet,planet,Utils.GAMESTATUS.MID);
		return new this(undefined,planet,planet,Utils.GAMESTATUS.LATE);
	}
	
}