'use strict'

const Bot = require('./Bot');
const StateBasic = require('../classes/StateBasic');

module.exports = class BotDead extends Bot {

	// Plays dead. That's it.

	constructor(ownername,neutralname){
		super(StateBasic,ownername,neutralname);
	}

	getMoves(){
		return [];
	}

}