'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageRequestPassive extends Message {

	static getRoutes(planet){
		return this.getRoutesNone(planet);
	}

	static getDefaultValue(){
		return [0];
	}

	reduce(messages){
		return this.reduceFirst(messages);
	}

	// index = turns in the future
	// value = armies that need to be present at that turn to ensure it stays allied
	static get(planet){
		let result = this.getDefaultValue();
		if(planet.moves_in.length === 0)
			return new this(undefined,planet,planet,result);
		// sort on turns descending
		let moves = planet.moves_in.sort((a,b) => a.turns!==b.turns ? b.turns-a.turns : b.player.type.localeCompare(a.player.type));
		// initialise to proper length
		for(let i=0;i<=moves.reduce((max,move) => move.turns>max?move.turns:max,0);i++)
			result[i] = 0;
		// initialise result with growths
		moves.filter(move => move.player.type === Utils.TYPES.HOSTILE).forEach(move => {
			for(let i=move.turns;i>=0;i--)
				result[i] = i+1-move.turns;
		});
		// add all moves
		moves.reverse();
		let lastattack = -1;
		moves.forEach(move => {
			for(let i=lastattack+1;i<move.turns;i++)
				if(move.player.type === Utils.TYPES.HOSTILE)
					result[i] += move.ships;
				else
					result[i] -= move.ships;
			if(move.player.type === Utils.TYPES.HOSTILE)
				lastattack = move.turns;
		});
		// return
		return new this(undefined,planet,planet,result);
	}
	
}