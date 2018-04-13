'use strict'

const Utils = require('../Utils');
const MessageGlobal = require('./MessageGlobal');

module.exports = class MessageGlobalPressure extends MessageGlobal {

	static get(planet){
		// if not hostile or no incoming attacks, no message
		if(planet.player.type !== Utils.TYPES.HOSTILE && planet.moves_in.every(move => move.player.type !== Utils.TYPES.HOSTILE))
			return;
		
		let pressure = 0;
		
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

	getMessageForRoute(route){
		let pressure = this.value-route.turns;
		//let pressure = this.value;
		return new this.constructor(this.id,this.from,route.to,pressure);
	}
	
}