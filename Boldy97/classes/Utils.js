'use strict'

exports.TYPES = {};
exports.TYPES.NEUTRAL = 'NEUTRAL';
exports.TYPES.ALLIED = 'ALLIED';
exports.TYPES.HOSTILE = 'HOSTILE';

exports.WINSTATUS = {};
exports.WINSTATUS.WINNING_HARD = 'WINNING_HARD';
exports.WINSTATUS.WINNING = 'WINNING';
exports.WINSTATUS.EQUAL = 'EQUAL';
exports.WINSTATUS.LOSING = 'LOSING';
exports.WINSTATUS.LOSING_HARD = 'LOSING_HARD';

exports.GAMESTATUS = {};
exports.GAMESTATUS.EARLY = 'EARLY';
exports.GAMESTATUS.MID = 'MID';
exports.GAMESTATUS.LATE = 'LATE';

exports.crash = function(message){
	throw new Error(message);
};

exports.crashObject = function(object){
	exports.crash(JSON.stringify(object,null,'  '));
};

exports.isSorted = function(array,sorter){
	for(let i=1;i<array.length;i++)
		if(sorter(array[i-1],array[i]) > 0)
			return false;
	return true;
}

exports.shuffle = function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}