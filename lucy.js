"use strict";

 var memwatch = require('memwatch')
,heapdump = require('heapdump')
,util = require("util");

var Lucy = require('./squads/luci.js');
var Barney = require('./squads/barney.js');

/** And Lucy's Heart Starts Beating : Come  alive*/

Lucy.comeAlive(); //core

/** “Think of me like Yoda, but instead of being little and
green I wear suits and I’m awesome. I’m your bro—I’m Broda!” */
/** “Suits are full of joy. They’re the sartorial
equivalent of a baby’s smile.” */

Barney.comeAlive(Lucy); //public figure

var snapshotTaken = false,
    hd;
memwatch.on('leak', function(info) {
    	
    console.log("leak:",info);
    
    var diff = hd.end();
    
    snapshotTaken = false;
    
    console.log(util.inspect(diff, {showHidden:false, depth:4}));
    
    heapdump.writeSnapshot('./.logs/heaps/' + Date.now() + '.heapsnapshot', function(err, filename) {

    });
});
memwatch.on('stats', function(stats) {
    console.log("stats:",stats);
    if(snapshotTaken==false){
        hd = new memwatch.HeapDiff();
        snapshotTaken = true;
    }/* else {
        var diff = hd.end();
        snapshotTaken = false;
        console.log(util.inspect(diff, {showHidden:false, depth:4}));
    }*/
});
