'use strict'

const Planet = require('./Planet');

module.exports = class PlanetRouted extends Planet{

	constructor(Future,Link,x,y,name,ships,player){
		super(Future,Link,x,y,name,ships,player);
	}
	
}