'use strict'

let TYPE_NEUTRAL = 0;
let TYPE_ALLIED = 1;
let TYPE_HOSTILE = 2;

let readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

readline.on('line',handleInput.bind(null,eval(process.argv[2])));

function handleInput(bot,state){
	console.log(JSON.stringify({moves:bot(JSON.parse(state))}));
}

// Utilities

function debug(message){
	throw new Error(message);
}

function debugObject(state){
	debug(JSON.stringify(state,(key,value)=>{
		if(key === 'from' || key === 'to')
			return value.name;
		if(key === 'ownertype' && value === TYPE_NEUTRAL)
			return 'TYPE_NEUTRAL';
		if(key === 'ownertype' && value === TYPE_ALLIED)
			return 'TYPE_ALLIED';
		if(key === 'ownertype' && value === TYPE_HOSTILE)
			return 'TYPE_HOSTILE';
		return value;
	},'  '));
}

function getTypeFromName(name){
	return name===0?TYPE_NEUTRAL:name===1?TYPE_ALLIED:TYPE_HOSTILE;
}

function getDistanceBetweenPlanets(a,b){
	return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y);
}

/*
	planet = {
		x: number,
		y: number,
		name: string,
		ships: number >= 0,
		owner: number/null,
		ownertype: TYPE_OWNER,
		moves: array - move - sorted by turns,
		future: array - futurestate - sorted by turns in future,
	}
	move = {
		from: planet,
		to: planet,
		ships: number >= 0,
		turns: number > 0,
		owner: number,
		ownertype: TYPE_OWNER,
	}
	futurestate = {
		ships: number >= 0,
		owner: number,
		ownertype: TYPE_OWNER,
	}
	result = {
		planets: array - planet,
		moves: array - move,
		planetsByType: array - array - planet,
	}
*/
function formatState(state){
	let result = {planets:[],moves:[],planetsByType:[]};
	// Set result planets
	for(let planet of state.planets){
		result.planets.push({
			x: planet.x,
			y: planet.y,
			name: planet.name,
			ships: planet.ship_count,
			owner: planet.owner || 0,
			ownertype: getTypeFromName(planet.owner || 0),
			moves: [],
			future: [{
				ships: planet.ship_count,
				owner: planet.owner || 0,
				ownertype: getTypeFromName(planet.owner || 0),
			}],
		});
	}
	// Set result moves and planet moves
	for(let expedition of state.expeditions){
		let move = {
			from: undefined,
			to: undefined,
			ships: expedition.ship_count,
			turns: expedition.turns_remaining,
			owner: expedition.owner || 0,
			ownertype: getTypeFromName(expedition.owner || 0),
		};
		// Set move from and to
		for(let planet of result.planets){
			if(planet.name === expedition.origin)
				move.from = planet;
			if(planet.name === expedition.destination)
				move.to = planet;
		}
		// Add move to result-moves and to-planet-moves
		result.moves.push(move);
		move.to.moves.push(move);
	}
	// Sort result moves
	result.moves.sort((a,b) => a.turns-b.turns);
	// Set result planetsByType
	for(let planet of result.planets){
		if(result.planetsByType[planet.ownertype] === undefined)
			result.planetsByType[planet.ownertype] = [];
		result.planetsByType[planet.ownertype].push(planet);
	}
	// Return
	return result;
}

function getFutureState(planet,turns){
	// If already calculated
	if(turns < planet.future.length)
		return planet.future[turns];
	// Recursive call
	if(turns > planet.future.length)
		hardBot_getFutureState(planet,turns-1);
	// Make new state
	let state = {
		ships: planet.future[planet.future.length-1].ships+1,
		owner: planet.future[planet.future.length-1].owner,
		ownertype: planet.future[planet.future.length-1].ownertype,
	};
	planet.future.push(state);
	// Check if a fight will happen
	let moves = planet.moves.filter(move => move.turns === turns);
	if(moves.length === 0)
		return state;
	// Fight!
	let competitors = [];
	competitors[state.owner] = {
		name: state.owner,
		ships: state.ships,
	};
	for(let move of moves){
		competitors[move.owner] = {
			name: move.owner,
			ships: (competitors[move.owner] || {ships:0}).ships + move.ships,
		};
	}
	competitors.sort((a,b) => !a?1:!b?-1:b.ships-a.ships);
	for(let i=competitors.length;i>=0;i--){
		if(competitors[i]){
			competitors.splice(i+1);
			break;
		}
	}
	// Set state owner and ships
	if(competitors.length === 1)
		state.ships += competitors[0].ships;
	else {
		state.ships = competitors[0].ships-competitors[1].ships;
		state.owner = state.ships===0?0:competitors[0].name;
		if(competitors[0].ships === competitors[1].ships)
			state.ships = 0;
	}
	// Set state ownertype
	state.ownertype = getTypeFromName(state.owner);
	// Return state
	return state;
}

// Bots

// Attacks with all planets to the nearest not-owned planet
function simpleBot(data){
	let moves = [];
	//For all planets that are mine
	for(let origin of data.planets){
		if(origin.owner !== 1)
			continue;
		//For all planets that are not mine
		let destination,dist = Infinity;
		for(let temp_destination of data.planets){
			if(temp_destination.owner === 1)
				continue;
			let temp_dist = getDistanceBetweenPlanets(origin,temp_destination);
			if(temp_dist < dist){
				destination = temp_destination
				dist = temp_dist;
			}
		}
		if(destination === undefined)
			continue;
		moves.push({
			origin: origin.name,
			destination: destination.name,
			ship_count: origin.ship_count,
		});
	}
	return moves;
}

// Attacks with all planets to the nearest not-owned planet, and holds armies for planets under attack
function mediumBot(data){
	let moves = [];
	// For all planets that are mine
	for(let planet_mine of data.planets){
		if(planet_mine.owner !== 1)
			continue;
		// For all planets that are not mine
		let destination,dist = Infinity;
		for(let planet_enemy of data.planets){
			if(planet_enemy.owner === 1)
				continue;
			let temp_dist = getDistanceBetweenPlanets(planet_mine,planet_enemy);
			if(temp_dist < dist){
				destination = planet_enemy
				dist = temp_dist;
			}
		}
		if(destination === undefined)
			continue;
		// For all expeditions on the way to my planet
		let reserved_ships = 0;
		for(let expedition of data.expeditions){
			if(expedition.destination !== planet_mine.name)
				continue;
			reserved_ships = Math.max(reserved_ships,expedition.ship_count-expedition.turns_remaining+1);
		}
		// If going to lose, flee!
		if(reserved_ships > planet_mine.ship_count)
			reserved_ships = 0;
		// Add move
		moves.push({
			origin: planet_mine.name,
			destination: destination.name,
			ship_count: planet_mine.ship_count-reserved_ships,
		});
	}
	return moves;
}



function hardBot(state){
	state = formatState(state);
	for(let planet of state.planets)
		getFutureState(planet,100);
	// TODO edit so it takes all ongoing moves into consideration
	/*if(planets[0].length !== 0)
		return hardBot_expansionPhase(state);*/
}



function hardBot_expansionPhase(state){
	
}