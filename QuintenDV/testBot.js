"use strict"

let counter = 0;

process.stdin.on("data", handle);

function debug(m){
    throw new Error("Turn "+counter + " -- " + m)
}

function calcDist(p1, p2){
    return (p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y);
}

function handle(text) {
    counter++;
    let obj = JSON.parse(text);
    let players = obj.players
    let planets = obj.planets

    let myPlanets = [];

    for (let planet of planets){
        if (planet.owner === 1){
                myPlanets.push(planet);
        }
    } 
    if (!myPlanets.length){
        console.log("");
        return;
    }

    let result = {
                    moves: [],
                 };

    // Find target for every planet
    for (let myPlanet of myPlanets){
        let enemyPlanet;
        let enemyDist = Infinity;
        let neutral;
        let neutralDist = Infinity;
        for (let planet of planets) {
            // Find neutral planet
            let dist = calcDist(myPlanet, planet);
            if (planet.owner === null) {
                if (neutralDist > dist){
                    neutralDist = dist;
                    neutral = planet;                   
                }
                continue;
            }
            
            // find closest enemyPlanet
            if (planet.owner !== 1){
                if (!enemyPlanet){
                    enemyPlanet = planet;
                }            
                if (enemyDist > dist){
                    enemyDist = dist;
                    enemyPlanet = planet;
                }
            }
        }

        if (!enemyPlanet && !neutral){
            //debug(myPlanet.name);
            enemyPlanet=myPlanet;
        }        
        result.moves.push({
        'origin': myPlanet['name'],
        'destination': neutral ? neutral['name']:enemyPlanet['name'],
        'ship_count': myPlanet['ship_count'] - 5  > 0 ? myPlanet['ship_count'] - 5 : 0
        });        
    }

    // Log moves
    console.log(JSON.stringify(result));
}
