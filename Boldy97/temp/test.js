const fs = require('fs');

String.prototype.replaceAll = function(search,replacement){
    var target = this;
    return target.replace(new RegExp(search,'g'),replacement);
};
let bot1 = 'BotElite1';
let bot2 = 'BotElite0';
let history0 = JSON.parse(fs.readFileSync(__dirname+'\\'+bot1+' vs '+bot2+'.json').toString());
//let history1 = JSON.parse(fs.readFileSync(__dirname+'\\BotElite1 vs BotHard.json').toString());

let wins = [0,0];
let draws = 0;
for(let i=0;i<20;i++){
	for(let j=0;j<i;j++){
		/*let difference = history0[i][j].winners.length !== history0[j][i].winners.length;
		if(!difference && history0[i][j].winners.length === 1)
			difference = (JSON.stringify(history0[i][j].winners) === JSON.stringify(history0[j][i].winners));
		if(difference){
			console.log(`bij ${JSON.stringify(history0[i][j].startpositions)} won in (${history0[i][j].length}) ${history0[i][j].winners}`);
			console.log(`bij ${JSON.stringify(history0[j][i].startpositions)} won in (${history0[j][i].length}) ${history0[j][i].winners}`);
			console.log();
		}*/
		/*if(history0[i][j].winners.length === 1 && history0[i][j].winners.includes(bot2))
			console.log(i+','+j);*/
		if(history0[i][j].winners.length === 1){
			if(history0[i][j].winners.includes(bot1))
				wins[0]++;
			if(history0[i][j].winners.includes(bot2))
				wins[1]++;
		} else {
			draws++;
		}
		if(history0[j][i].winners.length === 1){
			if(history0[j][i].winners.includes(bot1))
				wins[0]++;
			if(history0[j][i].winners.includes(bot2))
				wins[1]++;
		} else {
			draws++;
		}
	}
}
console.log(`${bot1} vs ${bot2}`);
console.log(`wins: ${wins}`);
console.log(`draws: ${draws}`);
console.log(`winrate: ${Math.floor(10000*wins[0]/(wins[0]+wins[1]))/100}%`);

/*for(let i=0;i<20;i++){
	for(let j=0;j<20;j++){
		if(history0[i][j] === null || history1[i][j] === null)
			continue;
		if(JSON.stringify(history0[i][j].winners).replaceAll('BotElite0','BotElite') !== JSON.stringify(history1[i][j].winners).replaceAll('BotElite1','BotElite')){
			console.log(`bij ${JSON.stringify(history0[i][j].startpositions)} won ${history0[i][j].winners}`);
			console.log(`bij ${JSON.stringify(history1[i][j].startpositions)} won ${history1[i][j].winners}`);
			console.log();
		}
	}
}*/