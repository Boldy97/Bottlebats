'use strict'

/* Variables */

let validBots = ['BotEasy','BotMedium','BotHard','BotElite'];

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
	let botname = process.argv[2];
	if(process.argv.length<3)
		botname = validBots[validBots.length-1];
	if(!validBots.includes(botname))
		Utils.crash(botname+' is not a valid bot!');
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
		}).bind(undefined,new BOTS[botname](1,null))
	);
})();