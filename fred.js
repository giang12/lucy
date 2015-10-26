var fs = require('fs-extra');
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

    self.VAULT = vaultAddress + (typeof vaultName === "string" ? "/" + vaultName + "/" : "/Lucy's Vault/");
    self.TRACK_AUDIO = self.VAULT + "track_audio/";
    self.TRACK_INFO = self.VAULT + "track_info/";
    self.TRACK_VIDEO = self.VAULT + "track_video/";
    self.folders = [self.VAULT, self.TRACK_AUDIO, self.TRACK_INFO, self.TRACK_VIDEO];

    return self.openVault();
};

Fred.prototype.openVault = function() {

    var self = this;

    if (typeof self.folders !== "object" || self.folders.length < 1) {
        
        console.log("Cannot open Vault", vaultName, "@", self.VAULT);
        console.log("Vault folders:");
        console.log(self.folders);

        self.isVaultOpen = false;
        return self;
    }

    self.folders.forEach(function(dir, index) {
        fs.ensureDirSync(dir);
    });

    self.isVaultOpen = true;

    console.log("Opened Vault", vaultName, "@", self.VAULT);

    return self;
};

Fred.prototype.checkVault = function(_tube_, _trackID_) {

    var deferred = Q.defer();
    var self = this;

    if (!self.isVaultOpen) {

        return Q.reject(new Error("Vault is not opened, try re openVault vault"));
    }

    console.log("Checking", _trackID_, "in", self.VAULT);
    // only send the dog out when the home(vault) address is set so he knows where to get back lol
    
    Puppy.fetch(_trackID_, _tube_).then(
        function(trackInfo){// this track info is the new search result

            deferred.resolve(self.save_the_baby(trackInfo));
        },
        function(err){

          deferred.reject(new Error(err));
        });

    return deferred.promise;
};

/**
 * [stdName description]
 * @param  {[Array]} names [list of name usually [songName, artist]]
 * @return {[String]}       [name of song cancat by "-", get rid of disallowed filename characters]
 */
Fred.prototype.stdName = function(names){

    return (names.join("-").replace(/[\/\\:*?"<>|]/g, ''));
};


Fred.prototype.clone_the_baby = function(vaultDes){

};

Fred.prototype.drop_the_baby = function(_abortedBae_){

};

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

    jsonfile.readFile(self.TRACK_INFO + _newborn_["song"]["id"], function(err, obj) {

        if (err || Ricky.isNewBetterThanOld(_newborn_.youtube.score, obj.youtube.score, true)) {
            
            console.log(_newborn_["youtube"]["urlShort"]);

            console.log("Saving Track:", _newborn_["song"]["id"], "(" + _newborn_["song"]["name"] + ") matched to YT ID:", _newborn_["youtube"]["urlShort"], "(" + _newborn_["youtube"]["title"] + "|" + _newborn_["youtube"]["channelTitle"] + ") | SCORE:", _newborn_["youtube"].score);


            //Configure YoutubeMp3Downloader with your settings
            var YD = new YoutubeMp3Downloader({
                "ffmpegPath": "./ffmpeg/ffmpeg", // Where is the FFmpeg binary located?
                "video_outputPath": self.TRACK_VIDEO, // Where should the downloaded and encoded files be stored?
                "video_ext": "mp4",
                "audio_ext": "mp3",
                "audio_outputPath": self.TRACK_AUDIO,
                "youtubeVideoQuality": "highest", // What video quality should be used?
                "queueParallelism": 2, // How many parallel downloads/encodes should be started?
                "progressTimeout": 2000 // How long should be the interval of the progress reports
            });
            //Download video and save as MP3 file

            var fileName = self.stdName([_newborn_["song"]["name"], _newborn_["song"]["artist"]]);

            YD.download(_newborn_["youtube"]["id"], fileName);
            YD.on("finished", function(data) {
                console.log(data);
            });
            YD.on("error", function(error) {
                console.log(error);
            });
            // YD.on("progress", function(progress) {
            //     console.log(progress);
            // });


            jsonfile.writeFile(self.TRACK_INFO + _newborn_["song"]["id"], _newborn_, {
                spaces: 2
            }, function(err) {
                if (err) console.log(err);
                deferred.reject(new Error(err));
            });

            deferred.resolve(_newborn_);
        } else {
            
            console.log(obj["youtube"]["urlShort"]);

            console.log("Track in Vault:", obj["song"]["id"], "(" + obj["song"]["name"] + ") matched to YT ID:", obj["youtube"]["urlShort"], "(" + obj["youtube"]["title"] + "|" + obj["youtube"]["channelTitle"] + ") | SCORE:", obj["youtube"].score);
            deferred.resolve(obj);
        }

    });
    
    return deferred.promise;
};

module.exports = Fred;