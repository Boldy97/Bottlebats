'use strict'

const Planet = require('./Planet');
const Route = require('./Route');

module.exports = class PlanetRouted extends Planet {

	constructor(Future,x,y,name,ships,player){
		super(Future,x,y,name,ships,player);
		this.routes = [];
		this.messages = [];
		this.values = {};
	}

	getRoute(to){
		return this.routes.find(route => route.to === to);
	}

	getMessage(id){
		return this.messages.find(message => message.id === id);
	}

	getValue(Message){
		return this.values[Message.name] || Message.getDefaultValue();
	}

	setValue(Message,value){
		this.values[Message.name] = value;
	}

	addRoute(to,via,turns){
		this.routes.push(new Route(this,to,via,turns));
	}

	addMessage(message){
		if(message === undefined)
			return;
		if(!this.getMessage(message.id))
			this.messages.push(message);
		if(message.from === this)
			this.broadcastMessage(message);
		else
			this.forwardMessage(message);
	}

	processTurn(){
		super.processTurn();
		this.messages = [];
		this.values = {};
	}

	processMessages(){
		this.messages.forEach(message => {
			if(this.values[message.constructor.name] !== undefined)
				return;
			this.setValue(message.constructor,
				message.reduce(
					this.messages.filter(message2 => message2.constructor.name === message.constructor.name)
				)
			);
		});
	}

	broadcastMessage(message){
		message.constructor.getRoutes(this).forEach(route => {
			this.forwardMessage(new message.constructor(
				message.id,
				this,
				route.to,
				message.value,
				message.turns+route.turns
			));
		});
	}

	forwardMessage(message){
		if(message.to === this)
			return;

		let route = this.getRoute(message.to);
		let nextmessage = route.via.getMessage(message.id);
		if(nextmessage !== undefined)
			nextmessage = nextmessage.getCopy(route);
		else
			nextmessage = message.getMessageForRoute(route);

		route.via.addMessage(nextmessage);
	}

}