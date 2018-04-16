'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessagePressureLocal extends Message {

	static getRoutes(planet){
		return this.getRoutesNone(planet);
	}

	static getDefaultValue(){
		return 0;
	}

	reduce(messages){
		return this.reduceSum(messages);
	}

	// value = howmuch more attackers than defenders are on (the way to) this planet
	static get(planet){
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