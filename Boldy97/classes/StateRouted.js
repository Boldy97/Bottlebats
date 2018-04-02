'use strict'

const Utilities = require('./Utilities');
const {State} = require('./State');

let routing;

module.exports = class StateRouted extends State {

	constructor(ownername,neutralname){
		super(ownername,neutralname);
		this.routing = this.getRouting();
	}

	getRouting(){
		if(routing !== undefined)
			return routing;

		let N = this.planets.length, D = [], E = [];
		for(let i=0;i<N;i++){
			D[i] = [];
			E[i] = [];
		}
		for(let i=0;i<N;i++)
			for(let j=i;j<N;j++)
				D[i][j] = D[j][i] = E[i][j] = E[j][i] = this.planets[i].getDistance(this.planets[j]);

		for(let k=0;k<N;k++)
			for(let i=0;i<N;i++)
				for(let j=0;j<i;j++)
					if(D[i][j] > D[i][k] + D[k][j])
						D[i][j] = D[i][k] + D[k][j];

		//this.printTable(D);

		for(let i=0;i<N;i++)
			this.planets[i].routing = {};
		let L = [];
		for(let i=0;i<N;i++){
			L[i] = [];
			for(let j=0;j<i;j++)
				if(D[i][j] === E[i][j])
					L[i].push(j);
			/*for(let j=0;j<i;j++){
				// TODO check if distance equal to original
				// TODO if so, link right away
				// TODO if not, get
				this.planets[i].routing[this.planets[j].name] = 
				this.planets.
			}*/
		}

		this.getSvg(L);
		/*this.printTable(E);
		this.printTable(D);
		this.printTable(L);*/
		Utilities.crash();







		routing = {};
		return routing;
	}

	printTable(table){
		for(let i=0;i<80;i++)
			process.stdout.write('-');
		for(let i=0;i<table.length;i++){
			for(let j=0;j<table[i].length;j++)
				process.stdout.write(table[i][j]+'\t');
			console.log();
		}

		for(let i=0;i<80;i++)
			process.stdout.write('-');
	}

	getSvg(links){
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

		console.log(`<svg style='width:100%;height:auto' viewBox='${dims.x[0]-1} ${dims.y[0]-1} ${dims.x[1]-dims.x[0]+2} ${dims.y[1]-dims.y[0]+2}' >`);
		this.planets.forEach(planet => {
			console.log(`<circle fill='black' cx='${planet.x}'' cy='${planet.y}' r='1' />`);
		});
		for(let i=0;i<links.length;i++)
			for(let j=0;j<links[i].length;j++){
				let r = [Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()-0.5];
				console.log(`<line stroke='red' stroke-width='0.1' stroke-linecap='round' x1='${this.planets[i].x+r[0]}' y1='${this.planets[i].y+r[1]}' x2='${this.planets[links[i][j]].x+r[2]}' y2='${this.planets[links[i][j]].y+r[3]}' />`);
			}
		// TODO add routing lines
		console.log('</svg>');
	}
}