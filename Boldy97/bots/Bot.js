'use strict'

module.exports = class Bot {

	constructor(stateclass,ownername,neutralname){
		this.state = new stateclass(ownername,neutralname);
	}

	processData(data){
		this.state.processData(data);
	}

	getMoves(){
		throw 'Must implement method getMoves';
	}

}