'use strict'

let MESSAGEIDCOUNTER = 1;

module.exports = class Message {

	constructor(id,from,to,value){
		this.id = id?id:MESSAGEIDCOUNTER++;
		this.from = from;
		this.to = to;
		this.value = value;
	}

	reduce(messages){
		return messages.reduce((value,message) => value += message.value,0);
	}

	static getDefaultValue(){
		return 0;
	}

	static get(planet){
		throw new Error('Must implement method get in '+this.name);
	}

	static getRoutes(planet){
		throw new Error('Must implement method getRoutes in '+this.name);
	}

	getCopy(route){
		return new this.constructor(this.id,this.from,route.to,this.value);
	}

	getMessageForRoute(route){
		throw new Error('Must implement method getMessageForRoute in '+this.constructor.name);
	}
	
}