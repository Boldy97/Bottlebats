'use strict'

const Link = require('./Link');

module.exports = class LinkRouted extends Link {

	constructor(planet,turns){
		super(planet,turns);
		this.distance = turns*turns;
	}

}