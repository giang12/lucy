"use strict";

var fs = require('fs-extra');
var path = require('path');
var jsonfile = require('jsonfile');
var Q = require('q');
var ytdl = require('ytdl-core');
var Cache = require("node-cache");

var YoutubeMp3Downloader = require('./lib/YoutubeMp3Downloader');
var spotify_daemon = require('./lib/spotify-node-applescript.js');

var Ethel = require('./ethel.js'); //spotifywebapi
//var Diana = require('./diana.js'); //media converter agent
var Puppy = require('./puppy.js'); //track_info_outputPath retriever
//var Diana = require('./lib/DianaTheConverter.js'); //media converter agent

var APP_DIR = path.dirname(process.mainModule.filename);

function _unlinkHandler(err) {

    if (err && err.code !== "ENOENT") {

        console.log(err);
    }
    return;
}

function Fred(_vaultAddress_, _vaultName_, _name_) {

    var my = this;
    my.name = _name_ || ("Fred<" + Math.random().toString() + ">");

    //private watcher to watcher over our vault
    //and their respective assignments
    // my.security_crew_members = [{
    //     watcher: new Diana("Deputy Dawg"),
    //     area: null,
    //     job: {
    //         fromExt: null,
    //         toExt: null,
    //     },
    //     contract: null
    // }, {
    //     watcher: new Diana("Officer Ubu"),
    //     area: null,
    //     job: {
    //         fromExt: null,
    //         toExt: null,
    //     },
    //     contract: null
    // }];

    //the good puppy that will fetch stuff
    // my.Diana_aud = new Diana("Deputy Dawg(resp for aud convertion)");
    // my.Diana_vid = new Diana("Officer Ubu(resp for vid convertion)");
    my.Puppy = new Puppy("Marco Polo");
    my.vaultIsOpen = false;
    my.changevault(_vaultAddress_, _vaultName_);

    return;
}
Fred.prototype.convertMediaInvault = function() {
    var my = this;
    //my.Diana_aud.mp3ToOgg(my.audio_outputPath, my.audio_outputPath);
    //my.Diana_vid.mp4ToWebm(my.video_outputPath, my.video_outputPath);
    return;
}
Fred.prototype.closevault = function() {

    var my = this;
    my.vaultIsOpen = false;
    /** let the crew rest since we close down the shop 
     *   aka unwatch*/
    // my.security_crew_members.forEach(function(member, index, arr) {
    //     //M.O.M - Ricky Hill  Movement @ https://www.youtube.com/watch?v=651E4R9RjAs
    //     if(member.contract === null) {return;} 
    //     member.watcher.unwatch(member.contract);
    //     member.contract = null;
    // });
};

Fred.prototype.changevault = function(_vaultAddress_, _vaultName_) {

    var my = this;

    if(my.vaultIsOpen){
        my.closevault();
    }
    if (typeof _vaultAddress_ !== "string" || typeof _vaultName_ !== "string") {

        return false;
    }

    my.vaultAddress = _vaultAddress_;
    my.vaultName = _vaultName_;

    my.vault = path.normalize((typeof vaultAddress === "string" ? my.vaultAddress : "./vaults") + "/" + (typeof my.vaultName === "string" ? my.vaultName : "Lucy's vault") + "/" );
    my.vault_resolved = path.resolve(my.vault);
    my.track_info_outputPath = my.vault_resolved + "/track_info";
    my.audio_outputPath = my.vault_resolved + "/track_audio";
    my.video_outputPath = my.vault_resolved + "/track_video";
    my.folders = [my.vault_resolved, my.audio_outputPath, my.track_info_outputPath, my.video_outputPath];

    //my.security_crew_members[0].area = my.audio_outputPath;
    //my.security_crew_members[0].job = {fromExt: "mp3", toExt: "ogg"};

    //my.security_crew_members[1].area = my.video_outputPath;
    //my.security_crew_members[1].job = {fromExt: "mp4", toExt: "webm"};

    return my.openvault();
};


/**
 * [_secure_the_parameters description]
 * @param  {[array]} assignment [list of tuples {watcher :, area:, contract}]
 *
 * @return {[type]}             [description]
 */
// Fred.prototype.security_crew_get_to_work = function() {

//     var my = this;

//     my.security_crew_members.forEach(function(member, index, arr) {

//         //this is so beautiful
//         //the members get their contract as they start watching the area they responsible for
//         //lawl 
//         //song suggestion time
//         //Move On - Garden City Movement @ https://www.youtube.com/watch?v=651E4R9RjAs 
//         if(member.contract !== null){
//             throw new Error(member.watcher.name + " cannot work security at more than 2 places at once");
//         }
//         member.contract = member.watcher.watch(member.area, member.job);
//     });
//     return;
// };

Fred.prototype.openvault = function() {

    var my = this;

    if (typeof my.folders !== "object" || my.folders.length < 1) {

        console.log(my.name, "cannot open vault", my.vaultName, "@", my.vault);
        //console.log("vault folders:");
        //console.log(my.folders);
        my.vaultIsOpen = false;
        return false;
    }

    my.folders.forEach(function(dir, index) {
        fs.ensureDirSync(dir);
    });

    /** Hire back the crew back to
     *   aka start watching over new area
     */
    //my.security_crew_get_to_work();
    my.convertMediaInvault();
    my.vaultIsOpen = true;

    console.log(my.name, "opened vault", my.vaultName, "@", my.vault);

    return true;
};

//check_vault cache
//_trackID_ is key
var Ely = new Cache({
        stdTTL: 720, //12 mins,
        checkperiod: 120,
        useClones: true
    })
    .on("set", function(key, value) {
        // ... do something ...   
        console.log("Ely cache", key);
        console.log("For the functioning of vault checking", "Stat:", Ely.getStats());
    })
    .on("del", function(key, value) {
        // ... do something ...   
        console.log("Ely del", key);
        console.log("Stat: ", Ely.getStats());
    })
    .on("expired", function(key, value) {
        // ... do something ...   
        console.log(key, "in vault cache check expired");
        console.log("Stat: ", Ely.getStats());
    })
    .on("flush", function() {
        // ... do something ...   
        console.log("Ely flushed the cache for vault check");
        console.log("Stat: ", Ely.getStats());
    });
/**
 * [check_vault description]
 * @param  {[type]} _tube_    [Youtube Channel]
 * @param  {[type]} _trackID_ [spotifyID eg 0eGsygTp906u18L0Oimnem but will also acceppt spotify:track:0eGsygTp906u18L0Oimnem];
 * @return {[type]}           [description]
 */
Fred.prototype.check_vault = function(_tube_, _trackID_) {

    //check cache before committing to deep shit or search lol
    var cache_value = Ely.get(_trackID_);

    if (cache_value !== undefined) {

        console.log("Fred found a cache for", _trackID_, "matching to", cache_value.song.title, "-", cache_value.song.artist);
        return Q.resolve(cache_value);
    }
    var deferred = Q.defer();
    var my = this;

    if (!my.vaultIsOpen) {

        return Q.reject(new Error("vault is not opened, try re openvault vault"));
    }

    console.log(my.name, "is checking for ", _trackID_, "in", my.vault);

    my.Puppy.fetch(_trackID_, _tube_).then(
        function(trackInfo) {
            // this track info is the new search result, not entirely fill
            // pass to save the baby to waterfall style fill out approriate part
            my.save_the_baby(trackInfo).then(
                function _cacheTheResult(_newborn_) {
                    //cache the results
                    Ely.set(_trackID_, _newborn_);

                    deferred.resolve(_newborn_);

                },
                function(err) {
                    /** Like these error ever happen lol?*/
                    console.log(err);
                    Ely.del(_trackID_);
                    deferred.reject(new Error(err));
                });
        },
        function(err) {
            console.log(err);
            Ely.del(_trackID_);
            deferred.reject(new Error(err));
        });

    return deferred.promise;
};

/**
 * [stdName description]
 * @param  {[Array]} names [list of name usually [songName, artist]]
 * @return {[String]}       [name of song cancat by "-", get rid of disallowed filename characters]
 */
Fred.prototype.stdName = function(names) {

    /**
     * TODO: Should replace illegal characters with encoded characters so later we can look at it maybe?
     * so we dont have to reference track_info_outputPath for correct name
     * e.g Who Drank My Whiskey"?" -> Who Drank My Whiskey(-question_mark-):
     */

    return (names.join("-").replace(/[\/\\:*?"<>|]/g, ''));
};


Fred.prototype.clone_the_baby = function(vaultDes) {

};

Fred.prototype.drop_the_baby = function(_abortedBae_) {

};
/*
Transaction Procedure save t
read track_info_outputPath in vault's downloadq[1] && track_info_outputPath[2]
var inQ = downloadq
var inV = track_info_outputPath
if inQ  -> immediate error : already in Q
if inV && t.score < 2.score -> immediate error : track in vault
download to downloadq 
 */

/**
 * [save_the_baby description]
 * @param  {[Object]} _newborn_ [Track Info: Read Puppy.js]
 * @return {[Object]}  the baby saved in vault [Track Info: Read Puppy.js]
 */
//var key = _newborn_.song.id;
var ZaPa = new Cache({
        stdTTL: 120, //2 mins,//stdTTL is in SECONDS
        checkperiod: 120,
        useClones: true
    })
    .on("set", function(key, value) {
        // ... do something ...   
        console.log("ZaPa added", key, "to the downloading Q");
        console.log("Stat: ", ZaPa.getStats());
    })
    .on("del", function(key, value) {
        // ... do something ...   
        console.log("ZaPa removed", key);
        console.log("Stat: ", ZaPa.getStats());
    })
    .on("expired", function(key, value) {
        // ... do something ...   
        console.log(key, "in the downloading Q expired");
        console.log("Stat: ", ZaPa.getStats());
    })
    .on("flush", function() {
        // ... do something ...   
        console.log("ZaPa got mad and push everyone out of the Q");
        console.log("Stat: ", ZaPa.getStats());
    });

function _hand_over(my, _mom_, _newborn_) {

    var fileName = my.stdName([_newborn_["song"]["title"], _newborn_["song"]["artist"]]);
    var key = _newborn_.song.id;

    var downloadOps = {
        "ffmpegPath": "./ffmpeg/ffmpeg", // Where is the FFmpeg binary located?
        "video_outputPath": my.video_outputPath, // Where should the downloaded and encoded files be stored?
        "audio_outputPath": my.audio_outputPath,
        "track_info_outputPath": my.track_info_outputPath,
        "youtubeVideoQuality": "highest", // What video quality should be used?
        "queueParallelism": 2, // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000 // How long should be the interval of the progress reports
    };
    _newborn_.fileName = fileName;
    _newborn_.paths = { //Path to local files will be set by Fred after succesfully download
        self: path.relative(APP_DIR, path.normalize(my.track_info_outputPath + "/" + fileName)),
        yt_vid: path.relative(APP_DIR, path.normalize(my.video_outputPath + "/" + fileName)),
        yt_aud: path.relative(APP_DIR, path.normalize(my.audio_outputPath + "/" + fileName)),
    };
    //Configure YoutubeMp3Downloader with your settings
    var percentage = -100;
    var YD = new YoutubeMp3Downloader(downloadOps)
        .download(_newborn_, fileName)
        .on("finished", function(data) {

            console.log(data);

            ZaPa.del(key);
            my.convertMediaInvault();
            _mom_.resolve(_newborn_);
        })
        .on("error", function(error) {
            ZaPa.del(key);
            /**
             * on error remove the errornous download
             * Issue: when found better vid-> dl failed-> the "less suitable" vid in vaults is deleted lol
             * but a new video will be redownloaded "soon" after anyway
             * This will be fixed with a .temp download folder, all que go in there
             * sorta like the logahead thing, last check before making it into the CLUB yo
             * btw go listen to Slacks by St.South
             * https://www.youtube.com/watch?v=1EidCx-idrw
             */
            fs.unlink(_newborn_.paths.self, _unlinkHandler);
            fs.unlink(_newborn_.paths.yt_vid + "." + downloadOps.video_ext, _unlinkHandler);
            fs.unlink(_newborn_.paths.yt_aud + "." + downloadOps.audio_ext, _unlinkHandler);
            _mom_.reject(new Error(error));
        })
        .on("progress", function(task) {
            if (task.progress.percentage - percentage < 5) return;
            console.log("Download Updates:", JSON.stringify(task, null, 2));
            percentage = task.progress.percentage;
        });
    console.log(_newborn_.paths.self);
    jsonfile.writeFile(_newborn_.paths.self, _newborn_, {
            spaces: 2
        },
        function(err2) {
            if (!err2) return;
            console.log(err2);
            _mom_.reject(new Error(err2));
        });
}

Fred.prototype.save_the_baby = function(_newborn_) {

    var deferred = Q.defer();
    var my = this;
    var key = _newborn_.song.id;

    if (!my.vaultIsOpen) {

        console.log(my.name + ":", "vault is not opened, try re openvault vault");
        return Q.reject(new Error("vault is not opened, try re openvault vault"));
    }

    var obj = ZaPa.get(key);

    if (obj !== undefined) {
        console.log(my.name + ":", "Track already in Queue:", obj["song"]["title"], "(" + obj["song"]["id"] + ") matched to YT ID:", obj["youtube"]["title"], "(" + obj["youtube"]["urlShort"] + " | " + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
        return Q.resolve(obj);
    }

    console.log(_newborn_["youtube"]["urlShort"]);
    console.log("a.k.a", _newborn_["youtube"]["title"], " is the SUPPAWILLY");

    ZaPa.set(key, _newborn_);

    var fileName = my.stdName([_newborn_["song"]["title"], _newborn_["song"]["artist"]]);

    Q.nfcall(jsonfile.readFile, my.track_info_outputPath + "/" + fileName)
        .then(
            function yup(obj) {
                //if track in vault and the new one is not better just return the one in vault
                if (!my.Puppy.isNewBetterThanOld(_newborn_.youtube.score, obj.youtube.score, true)) {
                    console.log(obj["youtube"]["urlShort"]);
                    console.log(my.name, " found track in vault:", obj["song"]["id"], "(" + obj["song"]["title"] + ") matched to YT ID:", obj["youtube"]["urlShort"], "(" + obj["youtube"]["title"] + "|" + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
                    ZaPa.del(key);
                    return deferred.resolve(obj);
                }
                //new one is better than old one, update it
                console.log(my.name, "is updating track:", _newborn_["song"]["title"], "(" + _newborn_["song"]["id"] + ") matched to YT ID:", _newborn_["youtube"]["title"], "(" + _newborn_["youtube"]["urlShort"] + " | " + _newborn_["youtube"]["channelTitle"] + ") | SCORE:", _newborn_["youtube"].score);
                 console.log("Old Track:", obj["song"]["title"], "(" + obj["song"]["id"] + ") matched to YT ID:", obj["youtube"]["title"], "(" + obj["youtube"]["urlShort"] + " | " + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
                return _hand_over(my, deferred, _newborn_);
                
            },
            function nup(err) {
                console.log(my.name, "is saving track:", _newborn_["song"]["title"], "(" + _newborn_["song"]["id"] + ") matched to YT ID:", _newborn_["youtube"]["title"], "(" + _newborn_["youtube"]["urlShort"] + " | " + _newborn_["youtube"]["channelTitle"] + ") | SCORE:", _newborn_["youtube"].score);
                return _hand_over(my, deferred, _newborn_);
            }
    ).done();

    return deferred.promise;
};

module.exports = Fred;
