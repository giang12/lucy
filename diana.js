"use strict";
var fs = require('fs-extra');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var async = require('async');
var ffmetadata = require("ffmetadata");
var Cache = require("node-cache");
var chokidar = require('chokidar');
var Q = require('q');
/**
 * This is dedicated for that one time we had time to catch up
 * on life after such a long time, and how funny we are facing the same shit lol
 * good experiences always
 */

/**
 Watch Media folders,
 on new mp4 -> convert to webm [ogv, blabla] in the same folder
 on new mp3 -> conver to t ogg in same folder

 [on file delete if webm or ogg, convert it back from mp4 or mp3 if exist]
 */
function Diana(_name) {

    var my = this;
    my.name = _name || ("Diana<" + Math.random().toString() + ">");
    my.Knowledge = new Forbidden_Knowledge("Raury (;.;)");
    return my;
}

//watch cache,
//_watched_folder is the key
//store obj {pin_count : number, watcher: chokidarOBJ}
function Nickky_Obj(_watcher) { //damn the creative naming
    return {
        pin_count: 1,
        watcher: _watcher
    };
}
var Nickky = new Cache({
        stdTTL: 0, //IMPORTANT //forever we want to only keep 1 watch per file/folder
        checkperiod: 120,
        useClones: false //IMPORTANT
    })
    .on("set", function(key, value) {
        // ... do something ...   
        console.log("Nickky cache ", key);
        console.log("Key added to watched list, Stat: ", Nickky.getStats());
    })
    .on("del", function(key, value) {
        // ... do something ...   
        console.log("Nickky del ", key);
        console.log("Key removed from watched list Stat: ", Nickky.getStats());
    })
    .on("expired", function(key, value) {
        // ... do something ...   
        console.log(key, "escaped from wached list");
        console.log("Stat: ", Nickky.getStats());
    })
    .on("flush", function() {
        // ... do something ...   
        console.log("Release all prisoners from wached list");
        console.log("Stat: ", Nickky.getStats());
    });

Diana.prototype.unwatch = function(_watched_folder) {

    var lookup = Nickky.get(_watched_folder);
    if (lookup === undefined) {
        return;
    } //nothing to unwatch
    lookup.pin_count--; //decrement pin count
    if (lookup.pin_count > 0) {
        return;
    } //there are still people interested in this folder
    if (typeof lookup.watcher === 'function') {
        lookup.watcher.close();
    };
    Nickky.del(_watched_folder);
    return _watched_folder;
};
/**
 * [watch description]
 * @param  {[type]} _watched_folder [media folder]
 * ././././track_audio || ./././track_video
 * @param  {[type]} _job            [{from_ext, to_ext}]
 * @return {[type]}                 [description]
 */
Diana.prototype.watch = function(_watched_folder, _job) {
    var my = this;
    /*
 on new mp4 -> convert to webm [ogv, blabla] in the same folder
 on new mp3 -> conver to t ogg in same folder

 [on file delete if webm or ogg, convert it back from mp4 or mp3 if exist]
 */
    var lookup = Nickky.get(_watched_folder);
    if (lookup !== undefined) {
        lookup.pin_count++;
        console.log(my.name, "reported Pin_Count:", lookup.pin_count, "Someone already watching", _watched_folder, "dont worry about it");
        return (_watched_folder);
    }

    //Initialize a new watcher
    var log = console.log.bind(console);

    var _shouldDoubleCheck = true; //so bad yo

    var watcher = chokidar.watch(path.resolve(_watched_folder), {
            ignored: /[\/\\]\./,
            persistent: true,
            ignoreInitial: true,
            followSymlinks: true,
            cwd: '.',
            usePolling: false,
            interval: 100,
            binaryInterval: 300,
            alwaysStat: false,
            depth: 99,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            },
            ignorePermissionErrors: false,
            atomic: true
        })
        .on('add', function(_path) {
            var parse = path.parse(_path);
            log(new Date() + ': File:', parse.base, 'has been added to', parse.dir);
            return _addHandler(my.Knowledge, parse, _job);
        })
        .on('change', function(path) {
            log(new Date() + ': File:', path, 'has been changed');
        })
        .on('unlink', function(path) {
            log(new Date() + ': File:', path, 'has been removed');
        })
        .on('addDir', function(path) {
            log(new Date() + ': Directory:', path, ' has been added');
        })
        .on('unlinkDir', function(path) {
            log(new Date() + ': Directory:', path, ' has been removed');
        })
        .on('error', function(error) {
            log(new Date() + ': Error happened:', error);
        })
        .on('ready', function() {
            log(new Date() + ':' + 'Initial scan complete. Ready for changes.');
        })
        // .on('raw', function(event, path, details) {
        //     log(new Date() + ': Raw event info:', event, path, details);
        // })
        // 'add', 'addDir' and 'change' events also receive stat() results as second
        // argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
        // watcher.on('change', function(path, stats) {
        //     if (stats) console.log(new Date() + ':' + 'File', path, 'changed size to', stats.size);
        // });

    Nickky.set(_watched_folder, new Nickky_Obj(watcher));
    return _watched_folder;


};

function _addHandler(Knowledge, parse, _job) {

    if (parse.ext !== "." + _job.fromExt.toString()) {
        return;
    }

    var task = new Task(parse.base, parse.dir, _job.fromExt, parse.dir, _job.toExt);
    console.log(task);
    return Knowledge.number_one(task);
    //check wheather we should do convertion here
    //file exist, not correct bla bla
}
module.exports = Diana;



function Task(fileName, fromAdd, fromExt, toAdd, toExt) {
    return {
        fileName: fileName,
        fromAdd: fromAdd,
        fromExt: fromExt,
        toAdd: toAdd,
        toExt: toExt,
        taskID: [fileName, fromAdd, fromExt, toAdd, toExt].join(":"),
        try_count: 0
    };
}
//use as a 12 mins QUEUE,
//things its
var Raury = new Cache({
        stdTTL: 720, //12 mins,
        checkperiod: 120,
        useClones: true
    })
    .on("set", function(key, value) {
        // ... do something ...   
        console.log("Raury cache", key);
        console.log("For the functioning of convertion stuff", "Stat:", Raury.getStats());
    })
    .on("del", function(key, value) {
        // ... do something ...   
        console.log("Raury del", key);
        console.log("Stat: ", Raury.getStats());
    })
    .on("expired", function(key, value) {
        // ... do something ...   
        console.log(key, "for convertion cache expired");
        console.log("Stat: ", Raury.getStats());
    })
    .on("flush", function() {
        // ... do something ...   
        console.log("Raury flushed the cache for convertion");
        console.log("Stat: ", Raury.getStats());
    });

function Forbidden_Knowledge(name) {
    /**
     * [my description]
     * @type {[type]}
     */
    var my = this;

    ffmpeg.setFfmpegPath('./ffmpeg/ffmpeg');

    my.downloadQueue = async.queue(function(task, callback) {

        my._convertor(task, function(err, result) {
            callback(err, result);
        });
    }, 2);
    my.name = name || ("Forbidden_Knowledge#<" + Math.random().toString() + ">");

    my._convertor = function(task, cb) {
        var proc;
        var fullFromAdd = task.fromAdd + "/" + task.fileName;
        var fullToAdd = task.toAdd + "/" + task.fileName;
        console.log(task.fromAdd + "/" + task.fileName);

        if (task.toExt === "webm") {
            proc = new ffmpeg({
                source: fullFromAdd
            })
                .on('error', function(err) {
                    fs.unlink(fullToAdd, function unlinkHandler(err) {

                        if (err && err.code !== "ENOENT") {

                            console.log(err);
                        }
                        return;
                    });
                    cb(task, null);
                })
                .on('end', function() {
                    cb(null, task);
                })
                .outputOptions('-map_metadata', '0')
                .outputOptions('-id3v2_version', '4')
                .outputOptions('-metadata', 'lupin=Giang,github:giang12')
                .videoCodec('libvpx')
                .audioCodec('libvorbis')
                .toFormat(task.toExt)
                .saveToFile(fullToAdd);
        } else if (task.toExt === "ogg") {
            proc = new ffmpeg({
                source: fullFromAdd
            })
                .on('error', function(err) {
                    fs.unlink(fullToAdd, function unlinkHandler(err) {

                        if (err && err.code !== "ENOENT") {

                            console.log(err);
                        }
                        return;
                    });
                    cb(task, null);
                })
                .on('end', function() {
                    cb(null, task);
                })
                .outputOptions('-id3v2_version', '4')
                .outputOptions('-metadata', 'lupin=Giang,github:giang12')
                .audioCodec('libvorbis')
                .toFormat(task.toExt)
                .saveToFile(fullToAdd);
        }
    }
}

Forbidden_Knowledge.prototype.number_one = function(task) {

    var my = this;

    if (Raury.get(task.taskID) !== undefined) {

        console.log("Raury:", "someone is already converting this resource, you dont have to worry about it");
        return;
    }
    console.log(my.name, "is converting", task.fileName, "to", task.toExt, "from", task.fromExt);

    Raury.set(task.taskID, task);

    my.downloadQueue.push(task, function(err, completed) {
        if (err) {
            console.log(my.name, "couldn't convert", err.fileName, "from", err.fromAdd, "to", err.toExt, "at this time, sorry baby <3");
            console.log(my.name, "said she will try again soon! Check back later bae");
            console.log(my.name, "removed", err.fileName, "from Q");
            fs.unlink(err.toAdd, function unlinkHandler(err) {

                if (err && err.code !== "ENOENT") {

                    console.log(err);
                }
                return;
            });
            Raury.del(err.taskID);

        } else {
            console.log(my.name, "successfully converted", completed.fileName, "from", task.fromAdd, "to", completed.toExt, "and saved in", completed.toAdd);
            console.log(my.name, "removed", completed.fileName, "from Q");

            //Raury.del(completed.taskID);
        }
        console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());
    });
    console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());
}



// function _mp4ToWebmAll(fromDir, destDir) {

//     fs.readdir(fromDir, function(err, files) {
//         if (err) return;

//         var mp4 = [];
//         var webm = [];

//         files.forEach(function(elm, index) {
//             var name = elm.split(".");
//             var ext = name.pop();
//             name = name.join(".");
//             if (ext === "mp4") {
//                 mp4.push(name);
//             } else if (ext === "webm") {
//                 webm.push(name);
//             }
//         });

//         var diff = mp4.filter(function(x) {
//             return (webm.indexOf(x) < 0);
//         });

//         //console.log(diff);

//         diff.forEach(function(elm, index) {

//             var fromAdd = path.resolve(fromDir + "/" + elm + ".mp4");
//             var toAdd = path.resolve(destDir + "/" + elm + ".webm");

//             console.log(fromAdd);
//             if (_isInQ(fromAdd)) {
//                 return;
//             }
//             var task = {
//                 fromAdd: fromAdd,
//                 fromExt: "mp4",
//                 toAdd: toAdd,
//                 toExt: "webm",
//                 fileName: elm,
//                 taskID: fromAdd
//             };
//             console.log("converting", elm, "to webm from", from);
//             _addToQ(fromAdd, task);
//             my.downloadQueue.push(task, function(err, completed) {
//                 if (err) {
//                     console.log(my.name, "couldn't convert", err.fileName, "from", err.fromAdd, "to", err.toExt, "at this time, sorry baby <3");
//                     console.log(my.name, "said she will try again soon! Check back later bae");
//                     console.log(my.name, "removed", err.fileName, "from Q");
//                     fs.unlink(err.toAdd + err.fileName, function unlinkHandler(err) {

//                         if (err && err.code !== "ENOENT") {

//                             console.log(err);
//                         }
//                         return;
//                     });
//                     _removeFromQ(err.taskID);

//                 } else {
//                     console.log(my.name, "successfully converted", completed.fileName, "from", task.fromAdd, "to", completed.toExt, "and saved in", completed.toAdd);
//                     console.log(my.name, "removed", completed.fileName, "from Q");
//                     _removeFromQ(completed.taskID);
//                 }
//                 console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());
//             });
//             console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());
//         });
//     });

// }

// function _mp3ToOggAll(fromDir, destDir) {
//     fs.readdir(from, function(err, files) {
//         if (err) return;

//         var mp3 = [];
//         var ogg = [];

//         files.forEach(function(elm, index) {
//             var name = elm.split(".");
//             var ext = name.pop();
//             name = name.join(".");
//             if (ext === "mp3") {
//                 mp3.push(name);
//             } else if (ext === "ogg") {
//                 ogg.push(name);
//             }
//         });

//         var diff = mp3.filter(function(x) {
//             return (ogg.indexOf(x) < 0);
//         });

//         console.log(diff);

//         diff.forEach(function(elm, index) {

//             var fromAdd = path.resolve(from + "/" + elm + ".mp3");
//             var toAdd = path.resolve(from + "/" + elm + ".ogg");

//             if (_isInQ(fromAdd)) {
//                 return;
//             }
//             var task = {
//                 fromAdd: fromAdd,
//                 fromExt: "mp3",
//                 toAdd: toAdd,
//                 toExt: "ogg",
//                 fileName: elm,
//                 taskID: fromAdd
//             };
//             console.log("converting", elm, "to ogg from", from);
//             _addToQ(fromAdd, task);
//             my.downloadQueue.push(task, function(err, completed) {
//                 if (err) {
//                     console.log("Failed converted", err.fileName, "from", err.fromAdd, "to", err.toExt);
//                     console.log("Removed from Q, retry in next tick");
//                     fs.unlink(err.toAdd + err.fileName, function unlinkHandler(err) {

//                         if (err && err.code !== "ENOENT") {

//                             console.log(err);
//                         }
//                         return;
//                     });
//                     _removeFromQ(err.taskID);
//                 } else {
//                     console.log("Successfully converted", completed.fileName, "from", task.fromAdd, "to", completed.toExt, "and saved in", completed.toAdd);
//                     console.log("Removed from Q");
//                     _removeFromQ(completed.taskID);
//                 }
//                 console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());
//             });
//             console.log(my.name, "'s queueSize", my.downloadQueue.running() + my.downloadQueue.length());

//         });
//     });

// }
