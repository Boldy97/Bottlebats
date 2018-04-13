'use strict'

const Link = require('./Link');

module.exports = class Route extends Link {

	constructor(from,to,via,turns){
		super(from,to,turns);
		this.via = via;
	}

}