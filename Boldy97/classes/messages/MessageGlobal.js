'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageGlobal extends Message {

	static getRoutes(planet){
		return planet.routes;
	}
	
}