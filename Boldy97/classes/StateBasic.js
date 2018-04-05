'use strict'

const Future = require('./Future');
const Link = require('./Link');
const Move = require('./Move');
const Player = require('./Player');
const Planet = require('./Planet');
const State = require('./State');
const Utils = require('./Utils');

module.exports = class StateBasic extends State {

	constructor(ownername,neutralname){
		super(Player,Planet,Move,Future,Link,ownername,neutralname);
	}
	
}