'use strict'

module.exports = class Bot {

	constructor(State,ownername,neutralname){
		this.state = new State(ownername,neutralname);
	}

	processData(data){
		this.state.processData(data);
	}

	getMoves(){
		throw new Error('Must implement method getMoves in '+this.constructor.name);
	}

}