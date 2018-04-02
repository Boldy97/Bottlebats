'use strict'

/* Variables */

let validBots = ['BotSimple','BotMedium','BotHard'];

/* Imports */

const Utilities = require('./classes/Utilities');
const BOTS = validBots.reduce((acc,val) => {
	acc[val] = require('./bots/'+val);
	return acc;
},{});

/* Libraries */

const fs = require('fs');
const fd = fs.openSync('temp/output.json','w');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

/* Start */

(() => {
	if(!validBots.includes(process.argv[2]))
		Utilities.crash(process.argv[2]+' is not a valid bot!');
	readline.on('line',
		((bot,data) => {
			bot.processData(JSON.parse(data));
			console.log(JSON.stringify({
				moves: bot.getMoves()
			}));
			if(false) // Toggle output.json
				fs.writeSync(fd,data+'\n');
		}).bind(undefined,new BOTS[process.argv[2]](1,null))
	);
})();