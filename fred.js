var fs = require('fs-extra');
var path = require('path');
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var jsonfile = require('jsonfile');
var Q = require('q');
var ytdl = require('ytdl-core');
var YoutubeMp3Downloader = require('./lib/YoutubeMp3Downloader');

var Ethel = new(require('./ethel.js'))();


var Ricky = new(require('./ricky.js'))();
var Puppy = require('./puppy.js');

var vaultAddress = "";
var vaultName = "";
var APP_DIR = path.dirname(process.mainModule.filename);

var Queue = {}; //TEMPORARY Q will be file based but until then lol

function Fred(_vaultAddress, _vaultName) {

    var self = this;
    self.isVaultOpen = false;
    return self.changeVault(_vaultAddress, _vaultName);
}

Fred.prototype.changeVault = function(_vaultAddress, _vaultName) {

    var self = this;
    self.isVaultOpen = false;
    if (typeof _vaultAddress !== "string" || typeof _vaultName !== "string") {

        return self;
    }

    vaultAddress = _vaultAddress;
    vaultName = _vaultName;

    self.VAULT = (typeof vaultAddress === "string" ? vaultAddress : "./vaults")  + (typeof vaultName === "string" ? "/" + vaultName + "/" : "/Lucy's Vault/");
    self.TRACK_AUDIO = self.VAULT + "track_audio/";
    self.TRACK_INFO = self.VAULT + "track_info/";
    self.TRACK_VIDEO = self.VAULT + "track_video/";
    self.folders = [self.VAULT, self.TRACK_AUDIO, self.TRACK_INFO, self.TRACK_VIDEO];

    return self.openVault();
};

Fred.prototype.openVault = function() {

    var self = this;

    if (typeof self.folders !== "object" || self.folders.length < 1) {

        console.log("Cannot open Vault", vaultName, "@", path.resolve(self.VAULT));
        console.log("Vault folders:");
        console.log(self.folders);

        self.isVaultOpen = false;
        return self;
    }

    self.folders.forEach(function(dir, index) {
        fs.ensureDirSync(dir);
    });

    self.isVaultOpen = true;

    console.log("Opened Vault", vaultName, "@", path.resolve(self.VAULT));

    return self;
};

Fred.prototype.checkVault = function(_tube_, _trackID_) {

    var deferred = Q.defer();
    var self = this;

    if (!self.isVaultOpen) {

        return Q.reject(new Error("Vault is not opened, try re openVault vault"));
    }

    console.log("Checking", _trackID_, "in", self.VAULT);

    Puppy.fetch(_trackID_, _tube_).then(
        function(trackInfo) { // this track info is the new search result

            deferred.resolve(self.save_the_baby(trackInfo));
        },
        function(err) {

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
     * so we dont have to reference track_info for correct name
     * e.g Who Drank My Whiskey"?" -> Who Drank My Whiskey(-question_mark-):
     */

    return (names.join("-").replace(/[\/\\:*?"<>|]/g, ''));
};


Fred.prototype.clone_the_baby = function(vaultDes) {

};

Fred.prototype.drop_the_baby = function(_abortedBae_) {

};
function addToQ(_newborn_){

    Queue[_newborn_["song"]["id"]] = _newborn_;
}
function removeFromQ(_newborn_){
    delete Queue[_newborn_["song"]["id"]];
}
function isInQ(_newborn_){

    return typeof Queue[_newborn_["song"]["id"]] !== 'undefined';
}
function unlinkHandler(err){

    if(err && err.code !== "ENOENT"){
        
        console.log(err);
    }
    return;
}
/*
Transaction Procedure save t
read TRACK_INFO in Vault's downloadq[1] && track_info[2]
var inQ = downloadq
var inV = track_info
if inQ  -> immediate error : already in Q
if inV && t.score < 2.score -> immediate error : track in vault
download to downloadq 
 */

/**
 * [save_the_baby description]
 * @param  {[Object]} _newborn_ [Track Info: Read Puppy.js]
 * @return {[Object]}  the baby saved in vault [Track Info: Read Puppy.js]
 */
Fred.prototype.save_the_baby = function(_newborn_) {

    var deferred = Q.defer();
    var self = this;

    if (!self.isVaultOpen) {

        console.log("Vault is not opened, try re openVault vault");
        return Q.reject(new Error("Vault is not opened, try re openVault vault"));
    }
    //temporary
    if(isInQ(_newborn_)){
        var obj = Queue[_newborn_["song"]["id"]];
        console.log("Track in Queue:", obj["song"]["id"], "(" + obj["song"]["name"] + ") matched to YT ID:", obj["youtube"]["urlShort"], "(" + obj["youtube"]["title"] + "|" + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
        return Q.resolve(obj);
    }

    addToQ(_newborn_);
    
    var fileName = self.stdName([_newborn_["song"]["name"], _newborn_["song"]["artist"]]);

    jsonfile.readFile(self.TRACK_INFO + fileName, function(err, obj) {

        if (err || Ricky.isNewBetterThanOld(_newborn_.youtube.score, obj.youtube.score, true)) {

            console.log(_newborn_["youtube"]["urlShort"]);

            console.log("Saving Track:", _newborn_["song"]["id"], "(" + _newborn_["song"]["name"] + ") matched to YT ID:", _newborn_["youtube"]["urlShort"], "(" + _newborn_["youtube"]["title"] + "|" + _newborn_["youtube"]["channelTitle"] + ") | SCORE:", _newborn_["youtube"].score);

            var downloadOps = {
                "ffmpegPath": "./ffmpeg/ffmpeg", // Where is the FFmpeg binary located?
                "video_outputPath": self.TRACK_VIDEO, // Where should the downloaded and encoded files be stored?
                "video_ext": "mp4",
                "audio_outputPath": self.TRACK_AUDIO,
                "audio_ext": "mp3",
                "youtubeVideoQuality": "highest", // What video quality should be used?
                "queueParallelism": 2, // How many parallel downloads/encodes should be started?
                "progressTimeout": 5000 // How long should be the interval of the progress reports
            };
            _newborn_.paths = { //Path to local files will be set by Fred after succesfully download
                yt_vid: path.relative( APP_DIR, downloadOps.video_outputPath +"/"+ fileName + "." + downloadOps.video_ext),
                yt_aud: path.relative( APP_DIR, downloadOps.audio_outputPath +"/"+ fileName + "." + downloadOps.audio_ext),
            };
            //Configure YoutubeMp3Downloader with your settings
            var YD = new YoutubeMp3Downloader(downloadOps);
            //Download video and save as MP3 file abd MP4 file
            YD.download(_newborn_, fileName);
            YD.on("finished", function(data) {

                console.log(data);
                removeFromQ(_newborn_);
                deferred.resolve(_newborn_);
                
            });
            YD.on("error", function(error) {
                removeFromQ(_newborn_);
                /**
                 * on error remove the errornous download
                 * Issue: when found better vid-> dl failed-> the "less suitable" vid in vaults is deleted lol
                 * THis will be ok when the Que is moved out to disk, so just a note lol
                 * btw go listen to Slacks by St.South
                 * https://www.youtube.com/watch?v=1EidCx-idrw
                 */
                fs.unlink(self.TRACK_INFO + fileName, unlinkHandler);
                fs.unlink(downloadOps.video_outputPath + fileName + "." + downloadOps.video_ext, unlinkHandler);
                fs.unlink(downloadOps.audio_outputPath + fileName + "." + downloadOps.audio_ext, unlinkHandler);
                deferred.reject(new Error(error));
            });
            YD.on("progress", function(progress) {
                console.log("Download Updates:", JSON.stringify(progress, null, 2));
            });
            jsonfile.writeFile(self.TRACK_INFO + fileName, _newborn_, {
                    spaces: 2
                }, function(err2) {
                    if (err2) {
                        console.log(err2);
                        deferred.reject(new Error(err2));
                    }
                });

        } else {

            console.log(obj["youtube"]["urlShort"]);
            console.log("Track in Vault:", obj["song"]["id"], "(" + obj["song"]["name"] + ") matched to YT ID:", obj["youtube"]["urlShort"], "(" + obj["youtube"]["title"] + "|" + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
            removeFromQ(_newborn_);
            deferred.resolve(obj);
        }

    });

    return deferred.promise;
};

module.exports = Fred;