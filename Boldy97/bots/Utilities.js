'use strict'

global.TYPE_NEUTRAL = 'NEUTRAL';
global.TYPE_ALLIED = 'ALLIED';
global.TYPE_HOSTILE = 'HOSTILE';

module.exports = class Utilities {

	static crash(message){
		throw new Error(message);
	}

	static crashObject(object){
		Utilities.crash(JSON.stringify(object,null,'  '));
	}

	static getTypeFromName(name){
		return name===0?global.TYPE_NEUTRAL:name===1?global.TYPE_ALLIED:global.TYPE_HOSTILE;
	}

	static getDistanceBetweenPlanets(a,b){
		return Math.ceil(Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)));
	}

	static getStateSchema(){
		return {
			title: 'State',
			type: 'object',
			properties: {
				players: {
					type: 'array',
					description: 'ordered by score descending',
					items: {
						type: 'player',
					},
				},
				planets: {
					type: 'array',
					items: {
						type: 'planet',
					},
				},
				moves: {
					type: 'array',
					description: 'ordered by turns ascending',
					items: {
						type: 'move',
					},
				},
				planetsByType: {
					type: 'object',
					properties: {
						NEUTRAL: {
							type: 'array',
							items: {
								type: 'planet',
							},
						},
						ALLIED: {
							type: 'array',
							items: {
								type: 'planet',
							},
						},
						HOSTILE: {
							type: 'array',
							items: {
								type: 'planet',
							},
						},
					},
				},
			},
			definitions: {
				ownertype: {
					type: 'string',
					enum: [
						global.TYPE_NEUTRAL,
						global.TYPE_ALLIED,
						global.TYPE_HOSTILE,
					],
				},
				player: {
					type: 'object',
					properties: {
						name: {
							type: 'integer',
							minimum: 1,
						},
						score: {
							type: 'integer',
							minimum: 1,
						},
						planets: {
							type: 'array',
							items: {
								type: 'planet',
							},
						},
					},
				},
				planet: {
					type: 'object',
					properties: {
						x: {
							type: 'number',
						},
						y: {
							type: 'number',
						},
						name: {
							type: 'string',
						},
						ships: {
							type: 'integer',
							minimum: 0,
						},
						owner: {
							type: 'integer',
							minimum: 0,
						},
						ownertype: {
							type: 'ownertype',
						},
						neighbours: {
							type: 'array',
							description: 'ordered by distance ascending',
							items: {
								type: 'planet',
							},
						},
						moves: {
							type: 'array',
							description: 'ordered by turns ascending',
							items: {
								type: 'move',
							},
						},
						future: {
							type: 'array',
							description: 'index is the amount of steps in the future',
							items: {
								type: 'futurestate',
							},
						},
					},
				},
				move: {
					type: 'object',
					properties: {
						from: {
							type: 'planet',
						},
						to: {
							type: 'planet',
						},
						ships: {
							type: 'integer',
							minimum: 1,
						},
						turns: {
							type: 'integer',
							minimum: 1,
						},
						owner: {
							type: 'integer',
							minimum: 1,
						},
						ownertype: {
							type: 'ownertype',
						},
					},
				},
				futurestate: {
					ships: {
						type: 'integer',
						minimum: 0,
					},
					owner: {
						type: 'integer',
						minimum: 0,
					},
					ownertype: {
						type: 'ownertype',
					},
				},
			},
		};
	}

	static stateToString(state){
		return JSON.stringify(state,(key,value)=>{
			if(key === 'from' || key === 'to')
				return value.name;
			if(key === 'neighbours')
				return value.map(planet => planet.name);
			return value;
		},'  ');
	}

	static formatState(state){
		let result = {players:[],planets:[],moves:[],planetsByType:{}};
		// Set result planets and players
		for(let planet of state.planets){
			result.planets.push({
				x: planet.x,
				y: planet.y,
				name: planet.name,
				ships: planet.ship_count,
				owner: planet.owner || 0,
				ownertype: Utilities.getTypeFromName(planet.owner || 0),
				neighbours: [],
				moves: [],
				future: [{
					ships: planet.ship_count,
					owner: planet.owner || 0,
					ownertype: Utilities.getTypeFromName(planet.owner || 0),
				}],
			});
		}
		// Set players
		for(let planet of result.planets){
			if(planet.ownertype === global.TYPE_NEUTRAL)
				continue;
			let player;
			for(let p of result.players)
				if(p.name === planet.owner){
					player = p;
					break;
				}
			if(player === undefined){
				player = {
					name: planet.owner,
					score: 0,
					planets: [],
				};
				result.players.push(player);
			}
			player.score += planet.ships;
			player.planets.push(planet);
		}
		result.players.sort((a,b) => b.score - a.score);
		for(let player of result.players)
			player.planets.sort((a,b) => b.ships - a.ships);
		// Set planet neighbours
		for(let planet of result.planets){
			for(let planet2 of result.planets){
				if(planet.name === planet2.name)
					continue;
				planet.neighbours.push(planet2);
			}
			planet.neighbours.sort((a,b) => Utilities.getDistanceBetweenPlanets(a,planet) - Utilities.getDistanceBetweenPlanets(b,planet));
		}
		// Set result moves and planet moves
		for(let expedition of state.expeditions){
			let move = {
				from: undefined,
				to: undefined,
				ships: expedition.ship_count,
				turns: expedition.turns_remaining,
				owner: expedition.owner || 0,
				ownertype: Utilities.getTypeFromName(expedition.owner || 0),
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

	static getFutureState(planet,turns){
		// If already calculated
		if(turns < planet.future.length)
			return planet.future[turns];
		// Recursive call
		if(turns > planet.future.length)
			Utilities.getFutureState(planet,turns-1);
		// Make new state
		let state = {
			ships: planet.future[planet.future.length-1].ships+(planet.future[planet.future.length-1].ownertype===global.TYPE_NEUTRAL?0:1),
			owner: planet.future[planet.future.length-1].owner,
			ownertype: planet.future[planet.future.length-1].ownertype,
		};
		planet.future[turns] = state;
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
		state.ownertype = Utilities.getTypeFromName(state.owner);
		// Return state
		return state;
	}
	
}