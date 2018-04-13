'use strict'

const Utils = require('../Utils');
const Message = require('./Message');

module.exports = class MessageLocal extends Message {

	static getRoutes(planet){
		return [];
		//return planet.links.map(link => planet.getRoute(link.to));
	}

	getMessageForRoute(route){
		return;
	}
	
}