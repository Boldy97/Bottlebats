'use strict'

let timer={};

module.exports = class Timer {

	static start(){
		let time = process.hrtime();
		time = time[0]*1000000+time[1]/1000;
		console.log('Timer started');
		timer.start = timer.step = time;
		timer.count = 0;
	}

	static step(silent){
		let time = process.hrtime();
		time = time[0]*1000000+time[1]/1000;
		if(!silent)
			console.log('Timer step: '+Math.ceil((time-timer.step)/1000)+'ms');
		timer.step = time;
		timer.count++;
	}

	static stop(){
		this.step(true);
		let time = process.hrtime();
		time = time[0]*1000000+time[1]/1000;
		console.log('Timer stop: average '+Math.ceil(((time-timer.start)/timer.count)/1000)+'ms over '+timer.count+' steps');
	}

}