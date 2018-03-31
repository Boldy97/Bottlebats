const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});
readline.on('line',
	function(line){ 
		var input = JSON.parse(line);
		stopHammerTime(input);
});
function stopHammerTime(input){
	console.log(input);
	if(input.expeditions.length)
	process.exit();
}
function bob(input){
	
}