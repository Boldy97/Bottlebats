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
	}

	processTurn(){
		super.processTurn();
		if(this.turns === 1)
			this.updateLinks();
	}

	updateLinks(){
		let N = this.planets.length;
		let dist = [];
		let dist_copy = [];
		for(let i=0;i<N;i++){
			dist[i] = [];
			dist_copy[i] = [];
			dist[i][i] = dist_copy[i][i] = 0;
		}
		for(let i=0;i<N;i++)
			for(let j=0;j<i;j++)
				dist[i][j] = dist[j][i] = dist_copy[i][j] = dist_copy[j][i] = this.planets[i].getLink(this.planets[j]).distance;


		for(let k=0;k<N;k++)
			for(let i=0;i<N;i++)
				for(let j=0;j<i;j++)
					if(dist[i][j] > dist[i][k] + dist[k][j])
						dist[i][j] = dist[i][k] + dist[k][j];

		//this.printTable(dist_copy);
		//this.printTable(dist);

		for(let i=0;i<N;i++)
			this.planets[i].links.length = 0;
		for(let i=0;i<N;i++)
			for(let j=0;j<i;j++)
				if(dist[i][j] === dist_copy[i][j])
					this.planets[i].addLink(this.planets[j],Math.sqrt(dist[i][j]));

		this.toSvg();
		/*this.printTable(E);
		this.printTable(D);
		this.printTable(L);*/
		//Utils.crash();
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
		for(let planet of this.planets)
			for(let link of planet.links)
				console.error(`<line stroke='red' stroke-width='0.1' stroke-linecap='round' x1='${planet.x}' y1='${planet.y}' x2='${link.planet.x}' y2='${link.planet.y}' />`);
		console.error('</svg>');
	}
}