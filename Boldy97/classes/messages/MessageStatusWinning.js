'use strict'

const Utils = require('../Utils');
const Message = require('./Message');
const MessageStatusScores = require('./MessageStatusScores');
const MessageStatusGame = require('./MessageStatusGame');

module.exports = class MessageStatusWinning extends Message {

	static getRoutes(planet){
		return this.getRoutesNone(planet);
	}

	static getDefaultValue(){
		return Utils.WINSTATUS.EQUAL;
	}

	reduce(messages){
		return this.reduceFirst(messages);
	}

	// value = the current win status
	static get(planet){
		// if earlygame, cannot make a decision
		if(planet.getValue(MessageStatusGame) === Utils.GAMESTATUS.EARLY)
			return new this(undefined,planet,planet,Utils.WINSTATUS.EQUAL);
		
		// get my score and other scores and the total of the others
		let scorestatus = planet.getValue(MessageStatusScores);
		let myscorestatus = scorestatus.find(score => score.player === planet.player.state.ownername);
		let otherscorestatus = scorestatus.filter(score => score.player !== planet.player.state.ownername);
		let otherscoretotal = otherscorestatus.reduce((sum,score) => sum+score.score,0);

		if(myscorestatus.score > 2*otherscoretotal) // over 66% of all ships are mine
			return new this(undefined,planet,planet,Utils.WINSTATUS.WINNING_HARD);
		if(myscorestatus.score > otherscoretotal) // over 50% of all ships are mine
			return new this(undefined,planet,planet,Utils.WINSTATUS.WINNING);
		if(otherscorestatus.length*2*myscorestatus.score < otherscoretotal) // with x players, less than 1/(2*x-1) of all ships are mine 
			return new this(undefined,planet,planet,Utils.WINSTATUS.LOSING_HARD);
		if(myscorestatus.score < otherscoretotal) // less than 50% of all ships are mine
			return new this(undefined,planet,planet,Utils.WINSTATUS.LOSING);
	}
	
}