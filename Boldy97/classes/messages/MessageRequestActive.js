'use strict'

const Utils = require('../Utils');
const Message = require('./Message');
const MessageRequestPassive = require('./MessageRequestPassive');

module.exports = class MessageRequestActive extends Message { // TODO use MessageRequestPassive

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
	// value = armies that need to be sent by that turn to defend the planet from all attacks
	static get(planet){
		// if not an allied planet, not applicable
		/*if(planet.player.type !== Utils.TYPES.ALLIED && planet.moves_in.every(move => move.player.type !== Utils.TYPES.ALLIED))
			return;*/
		if(planet.moves_in.length === 0)
			return;
		// if no incoming enemy attacks, request 0
		if(!planet.moves_in.find(move => move.player.type === Utils.TYPES.HOSTILE))
			return new this(undefined,planet,planet,this.getDefaultValue());

		let requested = this.getDefaultValue();
		// sort on turns, then on playertype (lower turns first, allied first)
		planet.moves_in.sort((a,b) => a.turns!==b.turns ? a.turns-b.turns : a.player.type.localeCompare(b.player.type));
		let ships = planet.ships;
		let lastturns = 0;
		let owned = planet.player.type === Utils.TYPES.ALLIED;
		planet.moves_in.forEach(move => {
			// make requested array long enough
			for(let i=requested.length;i<=move.turns;i++)
				requested[i] = 0;
			// check if planet was ours atleast once
			if(!owned){
				let future = planet.getFuture(move.turns);
				if(future.player.type === Utils.TYPES.ALLIED){
					owned = true;
					ships = future.ships;
					lastturns = move.turns;
				}
				return;
			}
			// planet is ours at turn (move.turns) with (ships+move.turns-lastturns) ships
			ships += move.turns-lastturns;
			lastturns = move.turns;
			// process turn
			if(move.player.type === Utils.TYPES.ALLIED)
				ships += move.ships;
			else
				ships -= move.ships;
			// check if still ours
			if(ships > 0)
				return;
			// planet lost!
			// TODO update requested
			for(let i=0;i<=move.turns;i++)
				requested[i] += 1-ships;
			ships = 1;
		});
		// remove all zero's from end
		for(let i=requested.length-1;i>0 && requested[i]===0;i--)
			requested.pop();
		// return
		return new this(undefined,planet,planet,requested);
	}
	
}