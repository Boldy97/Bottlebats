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
		this.armies = this.getArmies(moves);
		this.fight();
	}

	// Gives an array of armies, where each army has a player and ships
	// result is ordered by the amount of ships, decreasing
	getArmies(moves){
		return moves.reduce((armies,move) => {
			let army = armies.find(army => army.player.name === move.player.name);
			if(army === undefined)
				armies.push(army = {
					player: move.player,
					ships: 0,
				});
			army.ships += move.ships;
			return armies;
		},[{player:this.player,ships:this.ships}]).sort((a,b) => b.ships - a.ships);
	}

	fight(){
		this.player = this.armies[0].player;
		this.ships = this.armies[0].ships;
		if(this.armies.length>1){
			this.ships -= this.armies[1].ships;
			if(this.ships === 0)
				this.player = this.player.state.getPlayer(this.player.state.neutralname);
		}
	}

}