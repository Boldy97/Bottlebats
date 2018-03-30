'use strict'

exports.TYPE_NEUTRAL = 'NEUTRAL';
exports.TYPE_ALLIED = 'ALLIED';
exports.TYPE_HOSTILE = 'HOSTILE';
exports.TYPES = [
	exports.TYPE_NEUTRAL,
	exports.TYPE_ALLIED,
	exports.TYPE_HOSTILE,
];

exports.crash = function(message){
	throw new Error(message);
};

exports.crashObject = function(object){
	exports.crash(JSON.stringify(object,null,'  '));
};

exports.getPlayerTypeFromName = function(name,owner){
	return name===owner?exports.TYPE_ALLIED:name?exports.TYPE_HOSTILE:exports.TYPE_NEUTRAL;
};

exports.getDistance = function(p1,p2){
	return (p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y);
};

exports.getRealDistance = function(p1,p2){
	return Math.ceil(Math.sqrt(exports.getDistance(p1,p2)));
};