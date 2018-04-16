'use strict'

let MESSAGEIDCOUNTER = 1;

module.exports = class Message {

	constructor(id,from,to,value){
		this.id = id?id:MESSAGEIDCOUNTER++;
		this.from = from;
		this.to = to;
		this.value = value;
	}

	static getRoutes(planet){
		throw new Error('Must implement method getRoutes in '+this.name);
	}

	static getRoutesAll(planet){
		return planet.routes;
	}

	static getRoutesNone(planet){
		return [];
	}

	static getDefaultValue(){
		throw new Error('Must implement method getDefaultValue in '+this.name);
	}

	reduce(messages){
		throw new Error('Must implement method reduce in '+this.constructor.name);
	}

	reduceSum(messages){
		return messages.reduce((value,message) => value += message.value,0);
	}

	reduceFirst(messages){
		return messages[0].value;
	}
	
	reduceSumArray(messages){
		return messages.reduce((result,message) => {
			for(let i=0;i<message.value.length;i++)
				result[i] = (result[i]||0)+message.value[i];
			return result;
		},[]);
	}

	getCopy(route){
		return new this.constructor(this.id,this.from,route.to,this.value);
	}

	getMessageForRoute(route){
		throw new Error('Must implement method getMessageForRoute in '+this.constructor.name);
	}

	getMessageForRouteDecrementing(route){
		return new this.constructor(this.id,this.from,route.to,this.value-route.turns);
	}

	getMessageForRouteCopy(route){
		return new this.constructor(this.id,this.from,route.to,this.value);
	}

	static get(planet){
		throw new Error('Must implement method get in '+this.name);
	}
	
}