'use strict'

const Utils = require('../Utils');
const MessageLocal = require('./MessageLocal');

module.exports = class MessageReserved extends MessageLocal {

	// value = armies that cannot be sent away to not bring an impending loss closer
	static get(planet){
		// if not an allied planet, not applicable
		if(planet.player.type !== Utils.TYPES.ALLIED)
			return;
		// if no incoming enemy attacks, reserve 0
		if(!planet.moves_in.find(move => move.player.type === Utils.TYPES.HOSTILE))
			return new this(undefined,planet,planet,0);
		
		let lowest = planet.ships;
		let scope = planet.moves_in.reduce((scope,move) => move.turns>scope ? move.turns : scope,0);

		let moves = planet.moves_in.filter(move => move.player.type === Utils.TYPES.HOSTILE);
		moves.sort((a,b) => a.turns-b.turns);
		moves = moves.filter((move,i) => i===0 ? true : move.turns!==moves[i-1].turns);
		for(let i=0;i<moves.length;i++){
			let future = planet.getFuture(moves[i].turns);
			if(future.player.type !== Utils.TYPES.ALLIED)
				return new this(undefined,planet,planet,Math.min(planet.ships,planet.ships-lowest+1));
			if(future.ships < lowest)
				lowest = future.ships;
		}
		return new this(undefined,planet,planet,Math.min(planet.ships,planet.ships-lowest+1));
	}
	
}