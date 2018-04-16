'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessagePressureGlobal extends Message {

	static getRoutes(planet){
		return this.getRoutesAll(planet);
	}

	static getDefaultValue(){
		return 0;
	}

	reduce(messages){
		return this.reduceSum(messages);
	}

	getMessageForRoute(route){
		return this.getMessageForRouteDecrementing(route);
	}

	static get(planet){
		// if not hostile or no incoming attacks, no message
		if(planet.player.type !== Utils.TYPES.HOSTILE && planet.moves_in.every(move => move.player.type !== Utils.TYPES.HOSTILE))
			return;
		
		let pressure = this.getDefaultValue();
		
		if(planet.player.type === Utils.TYPES.HOSTILE)
			pressure += planet.ships;
		if(planet.player.type === Utils.TYPES.ALLIED)
			pressure -= planet.ships;

		planet.moves_in.forEach(move => {
			if(move.player.type === Utils.TYPES.HOSTILE)
				pressure += move.ships;
			if(move.player.type === Utils.TYPES.ALLIED)
				pressure -= move.ships;
		});

		return new this(undefined,planet,planet,pressure);
	}
	
}