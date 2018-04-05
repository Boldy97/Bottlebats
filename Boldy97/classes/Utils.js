'use strict'

exports.TYPES = {};
exports.TYPES.NEUTRAL = 'NEUTRAL';
exports.TYPES.ALLIED = 'ALLIED';
exports.TYPES.HOSTILE = 'HOSTILE';

exports.crash = function(message){
	throw new Error(message);
};

exports.crashObject = function(object){
	exports.crash(JSON.stringify(object,null,'  '));
};