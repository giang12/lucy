"use strict";
var fs = require('fs-extra');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var async = require('async');
var ffmetadata = require("ffmetadata");
var Cache = require("node-cache");
var chokidar = require('chokidar');

/**
 Watch Media folders,
 on new mp4 -> convert to webm [ogv, blabla] in the same folder
 on new mp3 -> conver to t ogg in same folder
 on file delete if webm or ogg, convert it back from mp4 or mp3 if exist
 */
function Diana(_name, _watch_folder, _fromExt, _toExt){

    var self = this;
    self.name = _name || ("Diana<" + Math.random().toString() + ">");
}
function Diana_old(name) {

    var self = this;

    ffmpeg.setFfmpegPath('./ffmpeg/ffmpeg');

    self.downloadQueue = async.queue(function(task, callback) {

        _convert(task, function(err, result) {
            callback(err, result);
        });
    }, 2);

    self.Queue = {};
    self.name = name || ("Diana<" + Math.random().toString() +">");

    function _addToQ(id, obj) {
        
        self.Queue[id] = obj;
    }

    function _removeFromQ(id) {

        delete self.Queue[id];
    }

    function _isInQ(id) {

        return typeof self.Queue[id] !== 'undefined';
    }

    function _mp4ToWebm(from, dest) {

        fs.readdir(from, function(err, files) {
            if (err) return;

            var mp4 = [];
            var webm = [];

            files.forEach(function(elm, index) {
                var name = elm.split(".");
                var ext = name.pop();
                name = name.join(".");
                if (ext === "mp4") {
                    mp4.push(name);
                } else if (ext === "webm") {
                    webm.push(name);
                }
            });

            var diff = mp4.filter(function(x) {
                return (webm.indexOf(x) < 0);
            });

            //console.log(diff);

            diff.forEach(function(elm, index) {

                var fromAdd = path.resolve(from + "/" + elm + ".mp4");
                var toAdd = path.resolve(dest + "/" + elm + ".webm");
                console.log(fromAdd);
                if (_isInQ(fromAdd)) {
                    return;
                }
                var task = {
                    fromAdd: fromAdd,
                    fromExt: "mp4",
                    toAdd: toAdd,
                    toExt: "webm",
                    fileName: elm,
                    taskID: fromAdd
                };
                console.log("converting", elm, "to webm from", from);
                _addToQ(fromAdd, task);
                self.downloadQueue.push(task, function(err, completed) {
                    if (err) {
                        console.log(self.name, "couldn't convert", err.fileName, "from", err.fromAdd, "to", err.toExt, "at this time, sorry baby <3");
                        console.log(self.name, "said she will try again soon! Check back later bae");
                        console.log(self.name, "removed", err.fileName,"from Q");
                        fs.unlink(err.toAdd + err.fileName, function unlinkHandler(err) {

                            if (err && err.code !== "ENOENT") {

                                console.log(err);
                            }
                            return;
                        });
                        _removeFromQ(err.taskID);

                    } else {
                        console.log(self.name, "successfully converted", completed.fileName, "from", task.fromAdd, "to", completed.toExt, "and saved in", completed.toAdd);
                        console.log(self.name, "removed", completed.fileName,"from Q");
                        _removeFromQ(completed.taskID);
                    }
                    console.log(self.name, "'s queueSize", self.downloadQueue.running() + self.downloadQueue.length());
                });
                console.log(self.name, "'s queueSize", self.downloadQueue.running() + self.downloadQueue.length());
            });
        });

    }

    function _mp3ToOgg(from, dest) {
        fs.readdir(from, function(err, files) {
            if (err) return;

            var mp3 = [];
            var ogg = [];

            files.forEach(function(elm, index) {
                var name = elm.split(".");
                var ext = name.pop();
                name = name.join(".");
                if (ext === "mp3") {
                    mp3.push(name);
                } else if (ext === "ogg") {
                    ogg.push(name);
                }
            });

            var diff = mp3.filter(function(x) {
                return (ogg.indexOf(x) < 0);
            });

            console.log(diff);

            diff.forEach(function(elm, index) {

                var fromAdd = path.resolve(from + "/" +elm + ".mp3");
                var toAdd = path.resolve(from + "/" + elm + ".ogg");

                if (_isInQ(fromAdd)) {
                    return;
                }
                var task = {
                    fromAdd: fromAdd,
                    fromExt: "mp3",
                    toAdd: toAdd,
                    toExt: "ogg",
                    fileName: elm,
                    taskID: fromAdd
                };
                console.log("converting", elm, "to ogg from", from);
                _addToQ(fromAdd, task);
                self.downloadQueue.push(task, function(err, completed) {
                    if (err) {
                        console.log("Failed converted", err.fileName, "from", err.fromAdd, "to", err.toExt);
                        console.log("Removed from Q, retry in next tick");
                        fs.unlink(err.toAdd + err.fileName, function unlinkHandler(err) {

                            if (err && err.code !== "ENOENT") {

                                console.log(err);
                            }
                            return;
                        });
                        _removeFromQ(err.taskID);
                    } else {
                        console.log("Successfully converted", completed.fileName, "from", task.fromAdd, "to", completed.toExt, "and saved in", completed.toAdd);
                        console.log("Removed from Q");
                        _removeFromQ(completed.taskID);
                    }
                    console.log(self.name, "'s queueSize", self.downloadQueue.running() + self.downloadQueue.length());
                });
                console.log(self.name, "'s queueSize", self.downloadQueue.running() + self.downloadQueue.length());

            });
        });

    }


    function _convert(task, cb) {
        var proc;
        if (task.toExt === "webm") {
            proc = new ffmpeg({
                source: task.fromAdd
            })
                .on('error', function(err) {
                    fs.unlink(task.toAdd, function unlinkHandler(err) {

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
                .saveToFile(task.toAdd);
        } else if (task.toExt === "ogg") {
            proc = new ffmpeg({
                source: task.fromAdd
            })
                .on('error', function(err) {
                    fs.unlink(task.toAdd, function unlinkHandler(err) {

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
                .saveToFile(task.toAdd);
        }
    }

    function _metaPol() {

    }

    self.mp3ToOgg = _mp3ToOgg;
    self.mp4ToWebm = _mp4ToWebm;

    return self;
}

module.exports = Diana;