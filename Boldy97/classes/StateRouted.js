'use strict'

const Future = require('./Future');
const LinkRouted = require('./LinkRouted');
const Move = require('./Move');
const Player = require('./Player');
const PlanetRouted = require('./PlanetRouted');
const State = require('./State');
const Utils = require('./Utils');

module.exports = class StateRouted extends State {

	constructor(ownername,neutralname){
		super(Player,PlanetRouted,Move,Future,LinkRouted,ownername,neutralname);
		this.basicRoutingMade = false;
		this.routingMade = false;
		this.k0 = 0;
		this.dist = null;
		this.via = null;
	}

	processTurn(){
		super.processTurn();
		if(!this.basicRoutingMade)
			this.makeBasicRouting();
		if(!this.routingMade)
			this.makeRouting();
	}

	makeBasicRouting(){
		for(let planet of this.planets)
			for(let link of planet.links)
				planet.addRoute(link.to,link.to,link.turns);
		this.basicRoutingMade = true;
	}

	makeRouting(){
		let N = this.planets.length;

		// pre-work
		if(!this.dist){
			this.dist = [];
			this.via = [];

			// O(N)
			for(let i=0;i<N;i++){
				this.dist[i] = [];
				this.via[i] = [];
				this.dist[i][i] = 0;
			}

			// O(N²)
			for(let i=0;i<N;i++)
				for(let j=0;j<i;j++){
					this.dist[i][j] = this.dist[j][i] = this.planets[i].getLink(this.planets[j]).distance;
					this.via[i][j] = j;
					this.via[j][i] = i;
				}
		}

		let start = Date.now();

		// O(N³)
		for(let k=this.k0;k<N;k++){
			if(Date.now()-start > 500){
				// calculating too long!
				this.k0 = k;
				return;
			}
			for(let i=0;i<N;i++)
				for(let j=0;j<N;j++)
					if(this.dist[i][j] > this.dist[i][k] + this.dist[k][j]){
						this.dist[i][j] = this.dist[i][k] + this.dist[k][j];
						this.via[i][j] = this.via[i][k];
					}
		}

		// finished

		for(let i=0;i<N;i++){
			this.planets[i].links.length = 0;
			this.planets[i].routes.length = 0;
		}

		for(let i=0;i<N;i++)
			for(let j=0;j<i;j++)
				if(this.via[i][j] === j)
					this.planets[i].addLink(this.planets[j],Math.sqrt(this.dist[i][j]));

		for(let i=0;i<N;i++)
			for(let j=0;j<N;j++)
				if(i !== j)
					this.planets[i].addRoute(
						this.planets[j],
						this.planets[this.via[i][j]],
						this.planets[i].getLink(this.planets[this.via[i][j]]).turns
					);

		this.routingMade = true;
	}

	printTable(table){
		for(let i=0;i<80;i++)
			process.stdout.write('-');
		console.log();
		for(let i=0;i<table.length;i++){
			for(let j=0;j<table[i].length;j++)
				process.stdout.write(table[i][j]+'\t');
			console.log();
		}

		for(let i=0;i<80;i++)
			process.stdout.write('-');
		console.log();
	}

	toSvg(){
		let dims = {
			x:[Infinity,-Infinity],
			y:[Infinity,-Infinity],
		};
		this.planets.forEach(planet => {
			if(planet.x < dims.x[0])
				dims.x[0] = planet.x;
			if(planet.x > dims.x[1])
				dims.x[1] = planet.x;
			if(planet.y < dims.y[0])
				dims.y[0] = planet.y;
			if(planet.y > dims.y[1])
				dims.y[1] = planet.y;
		});

		console.error(`<svg style='width:100%;height:auto' viewBox='${dims.x[0]-1} ${dims.y[0]-1} ${dims.x[1]-dims.x[0]+2} ${dims.y[1]-dims.y[0]+2}' >`);
		this.planets.forEach(planet => {
			console.error(`<circle fill='black' cx='${planet.x}'' cy='${planet.y}' r='1' />`);
		});
		for(let planet of this.planets){
			console.error(`${planet.name} - ${planet.links.length}`);
			for(let link of planet.links)
				console.error(`<line stroke='red' stroke-width='0.1' stroke-linecap='round' x1='${planet.x}' y1='${planet.y}' x2='${link.to.x}' y2='${link.to.y}' />`);
		}
		console.error('</svg>');
	}
}