'use strict'

const fs = require('fs');
const { spawn } = require('child_process');
const Utils = require('./Utils');
const BotDead = require('../bots/BotDead');
const BotEasy = require('../bots/BotEasy');
const BotMedium = require('../bots/BotMedium');
const BotHard = require('../bots/BotHard');
const BotElite = require('../bots/BotElite');
//const BotQuinten = require('../../QuintenDV/testBot');


function start(){
	//playOne(100,AdapterRobinElite,AdapterIkhramts);
	//playOne(500,AdapterRobinElite,AdapterBiggusBottus);
	//playOne(500,AdapterRobinMedium,AdapterRobinEasy);
	//playOne(500,new AdapterRobin(BotElite),new AdapterGoogleGoogle(1));
	//playOne(500,new AdapterRobin(BotMedium),new AdapterRobin(BotEasy));
	//playAllLarge(500,AdapterRobinElite,AdapterIkhramts);
	playOne(500,AdapterRobinElite,AdapterRobinEasy);
}

function playOne(turnlimit,bot1,bot2){
	let game = new Game(1,0,turnlimit,true,
		Game.mapHungerGames,
		//Game.mapSquare.bind(null,5,3),
		undefined,//[11,12],
		bot1,bot2,
	);
	game.execute(players => {
		console.log('winners: '+players.toString());
		console.log('game length: '+game.history.length);
	});
}

function playMultiple(turnlimit,bot1,bot2){
	let wins = {};
	let draws = {};
	wins[bot1.name] = 0;
	wins[bot2.name] = 0;
	draws[bot1.name] = 0;
	draws[bot2.name] = 0;
	let done = 0;
	let total = 10;
	for(let i=0;i<total;i++){
		new Game(1,0,turnlimit,false,
			Game.mapLarge,
			undefined,
			bot1,bot2,
		).execute(players => {
			if(players.length === 1)
				wins[players[0]]++;
			if(players.length > 1)
				for(let i=0;i<players.length;i++)
					draws[players[i]]++;
			done++;
			if(done === total){
				console.log('wins:');
				console.log(wins);
				console.log('draws:');
				console.log(draws);
			}
		});
	}
}

function playAllLarge(turnlimit,bot1,bot2){
	let wins = {};
	let draws = {};
	wins[bot1.getName()] = 0;
	wins[bot2.getName()] = 0;
	draws[bot1.getName()] = 0;
	draws[bot2.getName()] = 0;
	let startpositions = [];
	let history = [];
	for(let i=0;i<20;i++)
		for(let j=0;j<20;j++)
			if(i!==j)
				startpositions.push([i,j]);
	let done = 0;
	let total = startpositions.length;
	let doGame = function(startposition){
		let game = new Game(1,0,turnlimit,false,
			Game.mapLarge,
			startposition,
			bot1,bot2,
		);
		game.execute(((start1,start2,players) => {
			if(players.length === 1)
				wins[players[0]]++;
			if(players.length > 1)
				for(let i=0;i<players.length;i++)
					draws[players[i]]++;
			let starts = {};
			starts[bot1.getName()] = start1;
			starts[bot2.getName()] = start2;
			history.push({
				winners: players,
				length: game.history.length,
				startpositions: starts,
			});

			done++;
			if(done%1===0)
				console.log(done+'/'+total);
			if(done === total){
				console.log('wins:');
				console.log(wins);
				console.log('draws:');
				console.log(draws);
				let file = fs.openSync(__dirname+'\\..\\temp\\'+bot1.getName()+' vs '+bot2.getName()+'.json','w');
				fs.writeSync(file,JSON.stringify(history,null,'\t'));
			} else if(startpositions.length){
				setTimeout(doGame.bind(this,startpositions.pop()),1);
			}
		}).bind(this,startposition[0],startposition[1]));
	}
	for(let i=0;i<5;i++)
		doGame(startpositions.pop());
}

class Adapter {

	constructor(ownername,neutralname){
		this.ownername = ownername;
		this.neutralname = neutralname;
	}

	static getName(){
		throw 'Must implement method getName in '+this;
	}

	processData(data){
		throw 'Must implement method processData in '+this;
	}

	getMoves(callback){
		throw 'Must implement method getMoves in '+this;
	}

	exit(){
		
	}
}

class AdapterRobin extends Adapter {

	constructor(ownername,neutralname,Bot){
		super(ownername,neutralname);
		this.bot = new Bot(ownername,neutralname);
	}

	static getName(){
		return 'Robin'+this.name.split('AdapterRobin')[1];
	}

	processData(data){
		this.bot.processData(data);
	}

	getMoves(callback){
		callback(this.bot.getMoves());
	}
}

class AdapterRobinDead extends AdapterRobin {
	constructor(ownername,neutralname){super(ownername,neutralname,BotDead);}
}

class AdapterRobinEasy extends AdapterRobin {
	constructor(ownername,neutralname){super(ownername,neutralname,BotEasy);}
}

class AdapterRobinMedium extends AdapterRobin {
	constructor(ownername,neutralname){super(ownername,neutralname,BotMedium);}
}

class AdapterRobinHard extends AdapterRobin {
	constructor(ownername,neutralname){super(ownername,neutralname,BotHard);}
}

class AdapterRobinElite extends AdapterRobin {
	constructor(ownername,neutralname){super(ownername,neutralname,BotElite);}
}


class AdapterQuinten extends Adapter {

	static getName(){
		return 'QBOT9000';
	}

	processData(data){
		this.moves = BotQuinten.getMoves(JSON.stringify(data));
	}

	getMoves(callback){
		callback(this.moves);
	}
}

class AdapterGoogle extends Adapter {

	constructor(ownername,neutralname,command){
		super(ownername,neutralname);
		let parts = command.split(' ');
		this.bot = spawn(parts[0],parts.slice(1));
		this.done = true;
		this.callback = null;
		this.bot.stdout.on('data',this.recieveData.bind(this));
		this.bot.stderr.on('data',data => {
			//console.log('Bot errored: '+data);
		});
		this.bot.on('close',(code)=>{
			console.log('Bot closed with code: '+code);
		});
		this.distances = null;
		this.planetnames = null;
		this.moves = [];
	}

	processData(data){
		this.done = false;
		this.callback = null;
		if(!this.distances){
			this.distances = [];
			this.planetnames = [];
			for(let i=0;i<data.planets.length;i++){
				this.planetnames[i] = data.planets[i].name;
				this.distances[i] = [];
				for(let j=0;j<data.planets.length;j++)
					if(i!==j)
						this.distances[i][j] = Math.ceil((data.planets[i].x-data.planets[j].x)*(data.planets[i].x-data.planets[j].x)+(data.planets[i].y-data.planets[j].y)*(data.planets[i].y-data.planets[j].y));
			}
		}
		let text = '';
		data.planets.forEach(planet => {
			//this.bot.stdin.write(`P ${planet.x} ${planet.y} ${planet.owner} ${planet.ship_count} 1\n`);
			text += `P ${planet.x} ${planet.y} ${planet.owner} ${planet.ship_count} 1\n`;
		});
		data.expeditions.forEach(move => {
			let start = data.planets.findIndex(planet => planet.name === move.origin);
			let end = data.planets.findIndex(planet => planet.name === move.destination);
			this.bot.stdin.write(`F ${move.owner} ${move.ship_count} ${start} ${end} ${move.turns_remaining} ${move.turns_remaining}\n`);
			text += `F ${move.owner} ${move.ship_count} ${start} ${end} ${this.distances[start][end]} ${move.turns_remaining}\n`;
		});
		text += 'go\n';
		this.bot.stdin.write(text);
	}

	recieveData(data){
		data = data.toString().split('\n');
		for(let line of data){
			line = line.trim();
			if(line.includes('go')){
				this.done = true;
				this.submitMoves();
				return;
			}
			let move = line.split(' ');
			//console.log('Bot gave move: ',move);
			if(move.length !== 3)
				continue;
			this.moves.push({
				origin: this.planetnames[parseInt(move[0])],
				destination: this.planetnames[parseInt(move[1])],
				ship_count: parseInt(move[2]),
			});
		}
	}

	getMoves(callback){
		this.callback = callback;
		this.submitMoves();
	}

	exit(){
		this.bot.kill();
	}

	submitMoves(){
		if(!this.done || !this.callback)
			return;
		this.callback(this.moves);
		this.moves = [];
	}

}

class AdapterBiggusBottus extends AdapterGoogle {
	
	static getName(){
		return 'BiggusBottus';
	}

	constructor(ownername,neutralname){
		super(ownername,neutralname,'python ./bots/external/biggusbottus/MinOoBiggusBottus.py');
	}

	processData(data){
		this.done = false;
		console.log('Sending stuff');
		console.log(JSON.stringify(data));
		this.bot.stdin.write(JSON.stringify(data));
	}

	recieveData(data){
		console.log('got stuff');
		console.log(JSON.stringify(data));
		//this.done = true;
		// TODO this.submitMoves(); ?
	}
}

class AdapterGoogleGoogle extends AdapterGoogle {
	constructor(ownername,neutralname,index){
		let googlebots = ['Bully','Dual','Prospector','Rage','Random'];
		super(ownername,neutralname,'java -jar ./bots/external/google/'+googlebots[index]+'Bot.jar');
	}
	static getName(){return 'Google';}
}

class AdapterMrcarlosrendon extends AdapterGoogle {
	constructor(ownername,neutralname){super(ownername,neutralname,'python ./bots/external/mrcarlosrendon/MyBot.py');}
	static getName(){return 'mrcarlosrendon';}
}

class AdapterIkhramts extends AdapterGoogle {
	constructor(ownername,neutralname){super(ownername,neutralname,'./bots/external/ikhramts/MyBot.exe');}
	static getName(){return 'ikhramts';}
}

class Game {

	constructor(ownername,neutralname,turnlimit,giveoutput,mapper,custompositions,...bots){
		this.ownername = ownername;
		this.neutralname = neutralname;
		this.turnlimit = turnlimit;
		this.giveoutput = giveoutput;
		this.map = mapper();
		this.bots = [undefined,new BotDead(ownername,neutralname),...bots];
		for(let i=2;i<this.bots.length;i++)
			this.bots[i] = new this.bots[i](ownername,neutralname);
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

	static mapHex(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\hex.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			if(planet.owner)
				result.spots[planet.owner-1] = i;
		});
		return result;
	}

	static mapHungerGames(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\hungergames.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			if(planet.owner)
				result.spots[planet.owner-1] = i;
		});
		return result;
	}

	static mapLarge(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\large.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			planet.ship_count = 5;
			result.spots.push(i);
		});
		Utils.shuffle(result.spots);
		return result;
	}

	static mapSpiral(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\spiral.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			if(planet.owner)
				result.spots[planet.owner-1] = i;
		});
		return result;
	}

	static mapSpiral2(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\spiral2.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			if(planet.owner)
				result.spots[planet.owner-1] = i;
		});
		return result;
	}

	static mapUndecidable(){
		let result = JSON.parse(fs.readFileSync(__dirname+'\\..\\maps\\undecidable.json').toString());
		result.spots = [];
		result.planets.forEach((planet,i) => {
			if(planet.owner)
				result.spots[planet.owner-1] = i;
		});
		return result;
	}

	getPlayersRemaining(){
		let players = [];
		for(let planet of this.state.planets)
			if(planet.owner !== this.neutralname){
				let name = this.bots[planet.owner].constructor.getName();
				if(!players.includes(name))
					players.push(name);
			}
		for(let move of this.state.expeditions)
			if(move.owner !== this.neutralname){
				let name = this.bots[move.owner].constructor.getName();
				if(!players.includes(name))
					players.push(name);
			}
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
		if(this.bots[2].bot.state){
			this.bots[2].bot.state.planets.forEach(planet => {
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
		// NEW
		if(this.giveoutput)
			this.writeHistoryState(this.state);
		this.processMoves(this.getMoves());
	}

	getMoves(){
		let result = [];
		result.status = {finished:false,count:0,total:this.bots.length-2};
		for(let i=2;i<this.bots.length;i++){
			this.bots[i].getMoves(((botname,moves) => {
				moves.forEach(move => {
					move.owner = botname;
					result.push(move);
				});
				result.status.count++;
				if(result.status.count === result.status.total)
					result.status.finished = true;
			}).bind(this,i));
		}
		return result;
	}

	processMoves(moves){
		if(moves.status && !moves.status.finished){
			setTimeout(this.processMoves.bind(this,moves),10);
			return;
		}
		/*for(let move of moves){
			let origin = this.state.planets.find(planet => planet.name === move.origin);
			if(typeof move.ship_count !== 'number' || move.ship_count < 0 || move.ship_count > origin.ship_count)
				Utils.crash(`Invalid shipcount for move ${JSON.stringify(move)}\n${origin.ship_count} available`);
		}*/
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

		// NEW
		if(moves.status){
			if(this.getPlayersRemaining().length > 1 && this.history.length < this.turnlimit)
				this.passStateToBots();
			else {
				if(this.endgamecallback)
					this.endgamecallback(this.getPlayersRemaining());
				if(this.giveoutput)
					this.writeHistoryPost();
				for(let i=2;i<this.bots.length;i++)
					this.bots[i].exit();
			}
		}
	}

	execute(callback){
		this.endgamecallback = callback;
		if(this.giveoutput)
			this.writeHistoryPre();
		try {
			if(this.getPlayersRemaining().length > 1 && this.history.length < this.turnlimit)
				this.passStateToBots();
		} catch(e){
			if(this.giveoutput)
				this.writeHistoryPost();
			throw e;
		}
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
		fs.writeSync(this.file,'];redraw();</script></body></html>');
	}

}

start();