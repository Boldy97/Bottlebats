'use strict'

exports.crash = function(message){
	throw new Error(message);
};

exports.crashObject = function(object){
	exports.crash(JSON.stringify(object,null,'  '));
};