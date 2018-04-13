'use strict'

const Utils = require('../Utils');
const MessageLocal = require('./MessageLocal');

module.exports = class MessageLocalPressure extends MessageLocal {

	static get(planet){
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
	
}