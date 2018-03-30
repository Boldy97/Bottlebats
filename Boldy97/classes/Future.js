'use strict'

module.exports = class Future {

	constructor(state,planet,previous,moves){
		this.state = state;
		this.player;
		this.ships;

		if(previous === undefined)
			previous = {
				player: planet.player,
				ships: planet.ships - planet.player.getShipIncrement(),
			};

		let competitors = moves.reduce((competitors,move) => {
			if(competitors.every(competitor => competitor.player.name !== move.player.name))
				competitors.push({
					player: move.player,
					ships: 0,
				});
			competitors.find(competitor => competitor.player.name === move.player.name).ships += move.ships;
			return competitors;
		},[{
			player: previous.player,
			ships: previous.ships+previous.player.getShipIncrement(),
		}]).sort((a,b) => b.ships - a.ships);

		this.player = competitors[0].player;
		this.ships = competitors[0].ships;
		if(competitors.length > 1)
			this.ships -= competitors[1].ships;
		if(this.ships === 0)
			this.player = this.state.getNeutralPlayer();
	}

}