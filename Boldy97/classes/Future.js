'use strict'

module.exports = class Future {

	constructor(planet,previous,moves){
		this.planet = planet;
		if(previous){
			this.player = previous.player;
			this.ships = previous.ships + this.player.getShipIncrement();
		} else {
			this.player = planet.player;
			this.ships = planet.ships;
		}

		if(moves.length > 0)
			this.fight(moves);
	}

	fight(moves){
		let armies = moves.reduce((armies,move) => {
			let army = armies.find(army => army.player.name === move.player.name);
			if(army === undefined)
				armies.push(army = {
					player: move.player,
					ships: 0,
				});
			army.ships += move.ships
			return armies;
		},[this]).sort((a,b) => b.ships - a.ships);

		if(armies.length > 1)
			armies[0].ships -= armies[1].ships;
		if(armies[0].ships === 0)
			armies[0].player = this.player.state.getPlayer(this.player.state.neutralname);

		this.player = armies[0].player;
		this.ships = armies[0].ships;
	}

}