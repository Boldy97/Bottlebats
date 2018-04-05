'use strict'

/* Variables */

let validBots = ['BotSimple','BotMedium','BotHard'];

/* Imports */

const Utils = require('./classes/Utils');
const Timer = require('./classes/Timer');
const BOTS = validBots.reduce((acc,val) => {
	acc[val] = require('./bots/'+val);
	return acc;
},{});

/* Libraries */

const fs = require('fs');
const fd = fs.openSync(__dirname+'\\temp\\output.json','w');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

/* Start */

//Timer.start();
(() => {
	if(!validBots.includes(process.argv[2]))
		Utils.crash(process.argv[2]+' is not a valid bot!');
	readline.on('line',
		((bot,data) => {
			bot.processData(JSON.parse(data));
			console.log(JSON.stringify({
				moves: bot.getMoves()
			}));
			//bot.getMoves();
			//Timer.step();
			if(false) // Toggle output.json
				fs.writeSync(fd,data+'\n');
		}).bind(undefined,new BOTS[process.argv[2]](1,null))
	);
})();