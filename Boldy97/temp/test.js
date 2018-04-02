const Utilities = require('../classes/Utilities');

function printSVG(W,H,P,L){
	console.log(`<svg style='width:100%;height:auto' viewBox='-1 -1 ${W+1} ${H+1}'>`);
	for(let i=0;i<P.length;i++)
		console.log(`<circle fill='black' r='1.5' cx='${P[i].x}'' cy='${P[i].y}'/>`);
	for(let i=0;i<L.length;i++)
		for(let j=0;j<L[i].length;j++)
			console.log(`<line stroke='red' stroke-width='0.1' stroke-linecap='round' x1='${P[i].x}' y1='${P[i].y}' x2='${P[L[i][j]].x}' y2='${P[L[i][j]].y}' />`);
	for(let i=0;i<P.length;i++)
		/*console.log(`<text fill='white' font-size='1' x='${P[i].x}' y='${P[i].y}'>${i}</text>`);*/
	console.log('</svg>');
}

function printTable(T){
	for(let i=0;i<80;i++)
		process.stdout.write('-');
	for(let i=0;i<T.length;i++){
		for(let j=0;j<T[i].length;j++)
			process.stdout.write(i+','+j+','+Math.floor(T[i][j])+'\t');
		console.log();
	}

	for(let i=0;i<80;i++)
		process.stdout.write('-');
}

let N = 400; // number
let P = []; // points
let D = []; // distances
let DC = []; // distance copy
let L = []; // links
// time
let start = Date.now();
// populate graphs
for(let i=0;i<N;i++)
	P.push({x:Math.random()*N,y:Math.random()*N});
// distances
for(let i=0;i<N;i++){
	D[i] = [];
	DC[i] = [];
}
for(let i=0;i<N;i++)
	for(let j=0;j<i;j++)
		D[i][j] = D[j][i] = DC[i][j] = DC[j][i] = Utilities.getDistance(P[i],P[j]);
// floyd-warshall
for(let k=0;k<N;k++)
	for(let i=0;i<N;i++)
		for(let j=0;j<i;j++)
			if(D[i][j] > D[i][k] + D[k][j])
				D[i][j] = D[i][k] + D[k][j];
// links
for(let i=0;i<N;i++){
	L[i] = [];
	for(let j=0;j<i;j++)
		if(D[i][j] === DC[i][j]){
			L[i].push(j);
		}
}
// time
console.log(Date.now()-start);

/*printTable(DC);
printTable(D);*/
//printTable(L);

printSVG(N,N,P,L);