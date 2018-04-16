'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageFertility extends Message {

	static getRoutes(planet){
		return this.getRoutesAll(planet);
	}

	static getDefaultValue(){
		return -Infinity;
	}

	reduce(messages){
		return this.reduceSum(messages);
	}

	getMessageForRoute(route){
		return this.getMessageForRouteDecrementing(route);
	}

	// value = how desirable this planet is
	static get(planet){
		// if not a neutral planet, not applicable
		if(planet.player.type !== Utils.TYPES.NEUTRAL)
			return;
		
		return new this(undefined,planet,planet,100-planet.ships);
	}
	
}