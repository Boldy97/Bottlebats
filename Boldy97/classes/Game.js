'use strict'

const fs = require('fs');
const Utils = require('./Utils');
const BotDead = require('../bots/BotDead');
const BotSimple = require('../bots/BotSimple');
const BotMedium = require('../bots/BotMedium');
const BotHard = require('../bots/BotHard');
//const BotQuinten = require('../../QuintenDV/testBot');
const MessageReserved = require('./messages/MessageReserved');
const MessageRequested = require('./messages/MessageRequested');

function start(){
	//playOne();
	playMultiple();
}

function playOne(){
	new Game(1,null,true,
		new BotMedium(1,null),
		new BotHard(1,null),
		//new AdapterQuinten(),
	).execute()
}

function playMultiple(){
	let wins = [0,0];
	let draws = [0,0];
	for(let i=0;i<100;i++){
		let players = new Game(1,null,false,
			new BotMedium(1,null),
			new BotHard(1,null),
		).execute();
		if(players.size === 1)
			wins[players.values().next().value-2]++;
		if(players.size > 1){
			let values = players.values();
			for(let i=0;i<players.size;i++)
				draws[values.next().value-2]++;
		}
	}
	console.log('wins:');
	console.log(wins);
	console.log('draws:');
	console.log(draws);
}

class Adapter {

	processData(data){
		throw 'Must implement method processData in '+this;
	}

	getMoves(){
		throw 'Must implement method getMoves in '+this;
	}
}

class AdapterQuinten {

	processData(data){
		this.moves = BotQuinten.getMoves(JSON.stringify(data));
	}

	getMoves(){
		return this.moves;
	}
}

// TODO add adapters for other bots

class Game {

	constructor(ownername,neutralname,giveoutput,...bots){
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.giveoutput = giveoutput;
		this.bots = [undefined,new BotDead(ownername,neutralname),...bots];
		this.id = 0;
		this.state = {planets:[],expeditions:[]};
		this.history = [];
		this.init();
	}

	init(){
		let map = this.getMapLarge();
		//let map = this.getMapSquare(5,20);
		for(let planet of map.planets){
			planet.owner = this.neutralname;
			this.state.planets.push(planet);
		}
		for(let i=2;i<this.bots.length;i++)
			this.state.planets[map.spots[i-2]].owner = i;
		this.processMoves([]);
	}

	getMapLarge(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\games\\large.json').toString().split('\n')[0]);
		result.spots = [];
		result.planets.forEach((planet,i) => {
			planet.owner = this.neutralname;
			planet.ship_count = 5;
			result.spots.push(i);
		});
		Utils.shuffle(result.spots);
		return result;
	}

	getMapSquare(dim,dist){
		let result = {planets:[],spots:[0,dim*dim-1,dim-1,dim*(dim-1)]};
		for(let i=0;i<dim;i++)
			for(let j=0;j<dim;j++)
				result.planets.push({
					name:i+'-'+j,
					x:i*dist,
					y:j*dist,
					ship_count:5,
				});
		return result;
	}

	getPlayersRemaining(){
		let players = new Set();
		for(let planets of this.state.planets)
			players.add(planets.owner);
		for(let move of this.state.expeditions)
			players.add(move.owner);
		players.delete(this.neutralname);
		return players;
	}

	getStateCopy(){
		return {
			planets: this.state.planets.map(planet => {return {...planet}}),
			expeditions: this.state.expeditions.map(move => {return {...move}})
		};
	}

	passStateToBots(){
		for(let i=2;i<this.bots.length;i++){
			let state = this.getStateCopy();
			state.planets.forEach(planet => {
				if(planet.owner === i)
					planet.owner = this.ownername;
			});
			state.expeditions.forEach(move => {
				if(move.owner === i)
					move.owner = this.ownername;
			});
			this.bots[i].processData(state);
		}
		//TODO remove
		this.bots[3].state.planets.forEach(planet => {
			this.state.planets.find(planet2 => planet2.name === planet.name).meta =
			{
				reserved:planet.getValue(MessageReserved),
				links:planet.links.map(link => {
					return {
						from:link.from.name,
						to:link.to.name,
						turns:link.turns,
					};
				}),
				messages:planet.messages.map(message => {
					return {
						name:message.constructor.name,
						from:message.from.name,
						to:message.to.name,
						value:message.value
					};
				}),
			};
		});
	}

	getMoves(){
		let moves = [];
		for(let i=2;i<this.bots.length;i++){
			let botmoves = this.bots[i].getMoves();
			botmoves.forEach(move => move.owner = i);
			moves = moves.concat(botmoves);
		}
		return moves;
	}

	processMoves(moves){
		for(let move of moves)
			move.id = this.id++;
		for(let move of moves){
			let from = this.state.planets.find(planet => planet.name === move.origin);
			let to = this.state.planets.find(planet => planet.name === move.destination);
			move.turns_remaining = Math.ceil(Math.sqrt((from.x-to.x)*(from.x-to.x)+(from.y-to.y)*(from.y-to.y)))-1;
		}
		this.state = this.getStateCopy();
		this.state.expeditions = this.state.expeditions.concat(moves);
		this.bots[1].processData(this.state);
		this.state = JSON.parse(this.bots[1].state.toJSON());
		this.history.push(this.state);
	}

	execute(){
		while(this.getPlayersRemaining().size > 1 && this.history.length < 500){
			this.passStateToBots();
			this.processMoves(this.getMoves());
		}
		if(this.giveoutput)
			this.writeHistoryToFile();
		return this.getPlayersRemaining();
	}

	writeHistoryToFile(){
		console.log(this.history.length);
		let file = fs.openSync(__dirname+'\\..\\temp\\output.html','w');

		let dims = {
			x:[Infinity,-Infinity],
			y:[Infinity,-Infinity],
		};
		this.state.planets.forEach(planet => {
			if(planet.x < dims.x[0])
				dims.x[0] = planet.x;
			if(planet.x > dims.x[1])
				dims.x[1] = planet.x;
			if(planet.y < dims.y[0])
				dims.y[0] = planet.y;
			if(planet.y > dims.y[1])
				dims.y[1] = planet.y;
		});
		fs.writeSync(file,`
			<html><body>
			<textarea id='menu' rows='20' cols='50' required></textarea>
			<div id='controls'>
				<span>Turn:</span>
				<input id='turnSlider' type='range' min='0' max='${this.history.length-1}' value='0'>
				<br>
				<button id='previousButton'>Previous</button>
				<button id='nextButton'>Next</button>
				<br>
				<span>Speed:</span>
				<input id='speedSlider' type='range' min='1' max='100' value='1'>
				<br>
				<button id='playButton'>Play</button>
				<button id='stopButton'>Stop</button>
			</div>
			<svg viewBox='${dims.x[0]-1} ${dims.y[0]-1} ${dims.x[1]-dims.x[0]+2} ${dims.y[1]-dims.y[0]+2}'>
		`);
		this.state.planets.forEach(planet => {
			fs.writeSync(file,`
				<circle class='planet' id='planet_${planet.name}' r='1' stroke-width='0.1' stroke='white' cx='${planet.x}' cy='${planet.y}'/>
				<text id='planet_ships_${planet.name}' fill='white' stroke='none' font-size='1.5' x='${planet.x-0.5}'' y='${planet.y+0.5}'/>
				`);
		});
		fs.writeSync(file,'</svg>');

		fs.writeSync(file,`
			<style>
				body {
					background-color: black;
					color: white;
				}
				.move {
					transition: cx 1s linear,cy 1s linear;
				}
				#controls {
					position: absolute;
					top: 0.5em;
					left: 0.5em;
					z-index: 100;
				}
				svg {
					position: absolute;
					top: 0;
					left: 0;
					width: 70%;
					height: 100%;
				}
				textarea {
					position: absolute;
					top: 0;
					right: 0;
					width: 30%;
					height: 100%;
					z-index: -2;
				}
				textarea:invalid {
					visibility: hidden;
				}
			</style>
			<script>
				function redraw(){
					//planets
					for(let planet of turns[turn].planets){
						window['planet_ships_'+planet.name].innerHTML = planet.ship_count;
						window['planet_'+planet.name].setAttribute('fill',colors[planet.owner]);
					}
					//moves
					let elements = document.getElementsByClassName('move');
					for(let i=0;i<elements.length;i++)
						elements[i].setAttribute('visibility','hidden');
					for(let move of turns[turn].expeditions){
						let element = window['move_'+move.id];
						if(!element){
							element = document.createElementNS('http://www.w3.org/2000/svg','circle');
							document.getElementsByTagName('svg')[0].appendChild(element);
							element.setAttribute('r',0.2);
							element.setAttribute('id','move_'+move.id);
							element.setAttribute('class','move');
							element.setAttribute('fill',colors[move.owner]);
							element.setAttribute('ships',move.ship_count);
						}
						let from = window['planet_'+move.origin];
						let to = window['planet_'+move.destination];
						from = [parseFloat(from.getAttribute('cx')),parseFloat(from.getAttribute('cy'))];
						to = [parseFloat(to.getAttribute('cx')),parseFloat(to.getAttribute('cy'))];
						let vector = [from[0]-to[0],from[1]-to[1]];
						let vectorsize = Math.sqrt(vector[0]*vector[0]+vector[1]*vector[1])
						element.setAttribute('cx',to[0]+move.turns_remaining*vector[0]/vectorsize);
						element.setAttribute('cy',to[1]+move.turns_remaining*vector[1]/vectorsize);
						element.setAttribute('visibility','visible');
					}
				}
				function setTurn(newTurn){
					if(newTurn < 0 || newTurn >= turns.length)
						return;
					turn = newTurn;
					window.turnSlider.value = turn;
					redraw();
				}

				window.nextButton.onclick = (() => {
					setTurn(turn+1);
					redraw();
				});
				window.previousButton.onclick = (() => {
					setTurn(turn-1);
					redraw();
				});
				let timer;
				window.playButton.onclick = (() => {
					let f = () => {
						setTurn(turn+1);
						redraw();
						timer = setTimeout(f,delay);
					}
					window.playButton.setAttribute('disabled','true');
					f();
				});
				window.stopButton.onclick = (() => {
					clearTimeout(timer);
					window.playButton.removeAttribute('disabled');
				});
				window.turnSlider.oninput = ((e) => {
					setTurn(parseInt(e.target.value));
				});
				window.speedSlider.oninput = ((e) => {
					delay = 1000/Math.sqrt(parseInt(e.target.value));
					document.styleSheets[0].deleteRule(1);
					document.styleSheets[0].insertRule('.move { transition: cx '+delay/1000+'s linear,cy '+delay/1000+'s linear; }',1);
				});
				let planets = document.getElementsByClassName('planet');
				for(let i=0;i<planets.length;i++){
					planets[i].onmouseenter = ((e) => {
						let name = e.target.id.split('_')[1];
						window.menu.value = JSON.stringify(turns[turn].planets.find(planet => planet.name === name).meta,null,'  ');
					});
					planets[i].onmouseleave = ((e) => {
						window.menu.value = '';
					});
				}
				
				let turn = 0;
				let delay = 1000;
				let colors = [
					'#ffffff', //White
					'#000000', //Black
					'#e6194b', //Red
					'#3cb44b', //Green
					'#ffe119', //Yellow
					'#0082c8', //Blue
					'#f58231', //Orange
					'#911eb4', //Purple
					'#46f0f0', //Cyan
					'#f032e6', //Magenta
					'#d2f53c', //Lime
					'#fabebe', //Pink
					'#008080', //Teal
					'#e6beff', //Lavender
					'#aa6e28', //Brown
					'#fffac8', //Beige
					'#800000', //Maroon
					'#aaffc3', //Mint
					'#808000', //Olive
					'#ffd8b1', //Coral
					'#000080', //Navy
					'#808080', //Grey
				];
				let turns = 
		`);
		fs.writeSync(file,JSON.stringify(this.history)+';redraw();</script></body></html>');
	}

}

start();