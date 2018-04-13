'use strict'

const Link = require('./Link');

module.exports = class LinkRouted extends Link {

	constructor(from,to,turns){
		super(from,to,turns);
		this.distance = turns*turns;
	}

}