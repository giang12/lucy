var spotify_daemon = require('./lib/spotify-node-applescript.js');
var search_your_tube = require('./ricky.js').search_your_tube;
var jsonfile = require('jsonfile');
var Q = require('q');

var ytdl = require('ytdl-core');
var YoutubeMp3Downloader = require('youtube-mp3-downloader');

var VAULT = "";
var TRACK_AUDIO = "";
var TRACK_INFO = "";
var TRACK_VIDEO = "";

function golden_retriever(_tube_, _trackID_) {
    var deferred = Q.defer();

    console.log("Retrieving", _trackID_);

    spotify_daemon.getTrack(function(_error_, _track_) {

        if (_error_) return deferred.reject("The puppy got lost yo");
        var ret = {
            song: _track_,
            video: null,
            score: 0
        };
        search_your_tube(_tube_, _track_)
            .then(function success(value) {

                ret.video = value.video;
                ret.score = value.score;

                save_the_baby(ret);

                deferred.resolve(ret);

            }, function error(reason) {
                deferred.reject(reason);
            });
    });

    return deferred.promise;
}

function save_the_baby(_newborn_) {



    jsonfile.readFile(TRACK_INFO + _newborn_["song"]["id"], function(err, obj) {

        if (err || _newborn_.score > obj.score) {
            console.log(_newborn_["video"]["urlShort"]);

            console.log("Saving Track:", _newborn_["song"]["id"], "(" + _newborn_["song"]["name"] + ") matched to YT ID:", _newborn_["video"]["urlShort"], "(" + _newborn_["video"]["title"] + "|" + _newborn_["video"]["channelTitle"] + ") | SCORE:", _newborn_["score"]);


            //some vids crash the fucking app, e.g L$D asap fucking pls
            // ytdl(_newborn_["video"]["urlLong"], { filter: function(format) { return format.container === 'mp4'; } })
            //     .pipe(fs.createWriteStream("./vault/"+_newborn_["song"]["name"] +".mp4"));

            //Configure YoutubeMp3Downloader with your settings
            var YD = new YoutubeMp3Downloader({
                "ffmpegPath": "./ffmpeg/ffmpeg", // Where is the FFmpeg binary located?
                "outputPath": VAULT + "track_audio", // Where should the downloaded and encoded files be stored?
                "youtubeVideoQuality": "highest", // What video quality should be used?
                "queueParallelism": 2, // How many parallel downloads/encodes should be started?
                "progressTimeout": 2000 // How long should be the interval of the progress reports
            });
            //Download video and save as MP3 file
            YD.download(_newborn_["video"]["id"], (_newborn_["song"]["name"] + "-" + _newborn_["song"]["artist"]).replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') + ".mp3");
            YD.on("finished", function(data) {
                console.log(data);
            });
            YD.on("error", function(error) {
                console.log(error);
            });
            // YD.on("progress", function(progress) {
            //     console.log(progress);
            // });


            jsonfile.writeFile(TRACK_INFO + _newborn_["song"]["id"], _newborn_, {
                spaces: 2
            }, function(err) {
                if (err) console.log(err);
            });
            return _newborn_;
        } else {
            console.log(obj["video"]["urlShort"]);

            console.log("Track in Vault:", obj["song"]["id"], "(" + obj["song"]["name"] + ") matched to YT ID:", obj["video"]["urlShort"], "(" + obj["video"]["title"] + "|" + obj["video"]["channelTitle"] + ") | SCORE:", obj["score"]);
            return obj;
        }

    });
}

function setVault(_vault_) {

    VAULT = _vault_ + "/vault/";
    TRACK_AUDIO = VAULT + "track_audio/";
    TRACK_INFO = VAULT + "track_info/";
    TRACK_VIDEO = VAULT + "track_video/";

}
exports.checkVault = function(_tube_, _trackID_, _vault_) {

    setVault(_vault_);
    console.log("Checking", _trackID_, "in", VAULT);
    return golden_retriever(_tube_, _trackID_);
};