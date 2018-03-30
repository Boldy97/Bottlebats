'use strict'

/* Imports */

const Utilities = require('./classes/Utilities');
const BotSimple = require('./bots/BotSimple');
const BotMedium = require('./bots/BotMedium');
const BotHard = require('./bots/BotHard');

/* Libraries */

const fs = require('fs');
const fd = fs.openSync('output.json','w');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

/* Variables */

let validBots = ['BotSimple','BotMedium','BotHard'];

/* Start */

(() => {
	if(!validBots.includes(process.argv[2]))
		Utilities.crash(process.argv[2]+' is not a valid bot!');
	readline.on('line',
		((bot,state) => {
			console.log(
				JSON.stringify({
					moves:bot.getMoves(
						JSON.parse(state)
					)
				})
			);
			if(false) // Toggle output.json
				fs.writeSync(fd,state+'\n');
		}).bind(
			null,
			eval(process.argv[2])
		)
	);
})();