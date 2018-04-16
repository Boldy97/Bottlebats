'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageStatusScores extends Message {

	static getRoutes(planet){
		return this.getRoutesAll(planet);
	}

	static getDefaultValue(){
		return [];
	}

	reduce(messages){
		let value = messages.reduce((result,message) => {
			message.value.forEach(playerscore => {
				let match = result.find(val => val.player === playerscore.player);
				if(match === undefined){
					match = {player:playerscore.player,score:0};
					result.push(match);
				}
				match.score += playerscore.score;
			});
			return result;
		},[]);
		value.sort((a,b) => b.score - a.score);
		return value;
	}

	getMessageForRoute(route){
		return this.getMessageForRouteCopy(route);
	}

	static get(planet){
		let value = [];
		// current planet
		if(planet.player.type !== Utils.TYPES.NEUTRAL)
			value[0] = {player:planet.player.name,score:planet.ships};
		// outgoing moves
		planet.moves_out.forEach(move => {
			let match = value.find(val => val.player === move.player.name);
			if(match === undefined){
				match = {player:move.player.name,score:0};
				value.push(match);
			}
			match.score += move.ships;
		});
		// return
		return new this(undefined,planet,planet,value);
	}
	
}