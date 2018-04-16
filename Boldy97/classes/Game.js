'use strict'

const fs = require('fs');
const Utils = require('./Utils');
const BotDead = require('../bots/BotDead');
const BotEasy = require('../bots/BotEasy');
const BotMedium = require('../bots/BotMedium');
const BotHard = require('../bots/BotHard');
const BotElite = require('../bots/BotElite');
//const BotQuinten = require('../../QuintenDV/testBot');

function start(){
	playOne(BotElite1,BotHard);
	//playMultiple(BotElite0,BotHard);
	//playAllLarge(BotElite0,BotHard);
	//playAllLarge(BotElite1,BotHard);
	//playAllLarge(BotElite1,BotElite0);
}

function playOne(bot1,bot2){
	new Game(1,0,true,
		Game.mapLarge,
		[12,11],
		new bot1(1,0),
		new bot2(1,0),
		//new AdapterQuinten(),
	).execute();
}

function playMultiple(bot1,bot2){
	let wins = {};
	let draws = {};
	wins[bot1.name] = 0;
	wins[bot2.name] = 0;
	draws[bot1.name] = 0;
	draws[bot2.name] = 0;
	for(let i=0;i<10;i++){
		let players = new Game(1,0,false,
			Game.mapLarge,
			undefined,
			new bot1(1,0),
			new bot2(1,0),
		).execute();
		if(players.length === 1)
			wins[players[0]]++;
		if(players.length > 1)
			for(let i=0;i<players.length;i++)
				draws[players[i]]++;
	}
	console.log('wins:');
	console.log(wins);
	console.log('draws:');
	console.log(draws);
}

function playAllLarge(bot1,bot2){
	let wins = {};
	let draws = {};
	wins[bot1.name] = 0;
	wins[bot2.name] = 0;
	draws[bot1.name] = 0;
	draws[bot2.name] = 0;
	let history = [];
	for(let i=0;i<20;i++){
		history[i] = [];
		console.log(20*i+'/400');
		for(let j=0;j<20;j++){
			history[i][j] = null;
			if(i === j)
				continue;
			let game = new Game(1,0,false,
				Game.mapLarge,
				[i,j],
				new bot1(1,0),
				new bot2(1,0),
			);
			// get winner(s)
			let players = game.execute();
			if(players.length === 1)
				wins[players[0]]++;
			if(players.length > 1)
				for(let i=0;i<players.length;i++)
					draws[players[i]]++;
			let startpositions = {};
			startpositions[bot1.name] = i;
			startpositions[bot2.name] = j;
			history[i][j] = {
				winners: players,
				length: game.history.length,
				startpositions: startpositions,
			};
		}
	}
	console.log('wins:');
	console.log(wins);
	console.log('draws:');
	console.log(draws);
	let file = fs.openSync(__dirname+'\\..\\temp\\'+bot1.name+' vs '+bot2.name+'.json','w');
	fs.writeSync(file,JSON.stringify(history,null,'\t'));
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

	constructor(ownername,neutralname,giveoutput,mapper,custompositions,...bots){
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.giveoutput = giveoutput;
		this.map = mapper();
		this.bots = [undefined,new BotDead(ownername,neutralname),...bots];
		this.id = 0;
		this.state = {planets:[],expeditions:[]};
		this.history = [];
		this.init(custompositions);
		this.file;
	}

	init(custompositions){
		for(let planet of this.map.planets){
			planet.owner = this.neutralname;
			this.state.planets.push(planet);
		}
		for(let i=2;i<this.bots.length;i++)
			if(custompositions === undefined)
				this.state.planets[this.map.spots[i-2]].owner = i;
			else
				this.state.planets[custompositions[i-2]].owner = i;
		this.processMoves([]);
	}

	static mapLarge(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\games\\large.json').toString().split('\n')[0]);
		result.spots = [];
		result.planets.forEach((planet,i) => {
			planet.ship_count = 5;
			result.spots.push(i);
		});
		Utils.shuffle(result.spots);
		return result;
	}

	static mapHex(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\games\\hex.json').toString().split('\n')[0]);
		result.spots = [];
		result.planets.forEach((planet,i) => {
			planet.ship_count = 5;
			result.spots.push(i);
		});
		Utils.shuffle(result.spots);
		return result;
	}

	static mapSquare(dim,dist){
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
		let players = [];
		for(let planet of this.state.planets)
			if(planet.owner !== this.neutralname)
				if(!players.includes(this.bots[planet.owner].constructor.name))
					players.push(this.bots[planet.owner].constructor.name);
		for(let move of this.state.expeditions)
			if(move.owner !== this.neutralname)
				if(!players.includes(this.bots[move.owner].constructor.name))
					players.push(this.bots[move.owner].constructor.name);
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
		this.bots[2].state.planets.forEach(planet => {
			if(planet.messages){
				this.state.planets.find(planet2 => planet2.name === planet.name).meta = {
					values:planet.values,
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
			}
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
		for(let move of moves){
			let origin = this.state.planets.find(planet => planet.name === move.origin);
			if(typeof move.ship_count !== 'number' || move.ship_count < 0 || move.ship_count > origin.ship_count)
				Utils.crash(`Invalid shipcount for move ${JSON.stringify(move)}\n${origin.ship_count} available`);
		}
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
		if(this.giveoutput)
			this.writeHistoryPre();
		try{
			while(this.getPlayersRemaining().length > 1 && this.history.length < 500){
				this.passStateToBots();
				if(this.giveoutput)
					this.writeHistoryState(this.state);
				this.processMoves(this.getMoves());
			}
		} catch(e){
			if(this.giveoutput)
				this.writeHistoryPost();
			throw e;
		}
		if(this.giveoutput){
			this.writeHistoryState(this.state);
			this.writeHistoryPost();
		}
		return this.getPlayersRemaining();
	}

	writeHistoryPre(){
		this.file = fs.openSync(__dirname+'\\..\\temp\\output.html','w');

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

		fs.writeSync(this.file,`
			<html><body>
			<textarea id='menu' rows='20' cols='50' required></textarea>
			<div id='controls'>
				<span>Turn:</span>
				<input id='turnSlider' type='range' min='0' max='0' value='0'>
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
			fs.writeSync(this.file,`
				<circle class='planet' id='planet_${planet.name}' r='1' stroke-width='0.1' stroke='white' cx='${planet.x}' cy='${planet.y}'/>
				<text id='planet_ships_${planet.name}' fill='white' stroke='none' font-size='1.5' x='${planet.x-0.5}'' y='${planet.y+0.5}'/>
			`);
		});

		fs.writeSync(this.file,`
			</svg>
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
					//sliders
					window.turnSlider.setAttribute('max',turns.length);
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
					'#000000', //Black
					'#ffffff', //White
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
				let turns = [
		`);
	}

	writeHistoryState(state){
		fs.writeSync(this.file,JSON.stringify(state)+',');
	}

	writeHistoryPost(){
		console.log(this.history.length);
		fs.writeSync(this.file,'];redraw();</script></body></html>');
	}

}

start();