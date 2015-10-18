/**
 * Module dependencies
 */
var fs = require('fs');
var util = require('util');
var jsonfile = require('jsonfile');

var express = require('express');
var spotify_daemon = require('./lib/spotify-node-applescript.js');


var ytdl = require('ytdl-core');
var YoutubeMp3Downloader = require('youtube-mp3-downloader');

require("string_score");
var leven = require('leven');


var Youtube = require("youtube-api"),
    Logger = require("bug-killer"),
    Opn = require("opn");

/*

Copyright (c) 2014. All Rights reserved.

If you use this script, I'd love to know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

*/

var levenshteinenator = (function() {

    /**
     * @param String a
     * @param String b
     * @return Array
     */
    function levenshteinenator(a, b) {
        var cost;
        var m = a.length;
        var n = b.length;

        // make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
        if (m < n) {
            var c = a;
            a = b;
            b = c;
            var o = m;
            m = n;
            n = o;
        }

        var r = [];
        r[0] = [];
        for (var c = 0; c < n + 1; ++c) {
            r[0][c] = c;
        }

        for (var i = 1; i < m + 1; ++i) {
            r[i] = [];
            r[i][0] = i;
            for (var j = 1; j < n + 1; ++j) {
                cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
                r[i][j] = minimator(r[i - 1][j] + 1, r[i][j - 1] + 1, r[i - 1][j - 1] + cost);
            }
        }

        return r;
    }

    /**
     * Return the smallest of the three numbers passed in
     * @param Number x
     * @param Number y
     * @param Number z
     * @return Number
     */
    function minimator(x, y, z) {
        if (x < y && x < z) return x;
        if (y < x && y < z) return y;
        return z;
    }

    return levenshteinenator;

}());

var CREDENTIALS = jsonfile.readFileSync("./config/credentials.json");

var yt_oauth = Youtube.authenticate({
    type: "key",
    key: CREDENTIALS["yt_api_keys"]["lucy_alpha"]
});

var app = express();
var port = process.env.PORT || 3000;

var state = {
    track_id: null,
    volume: null,
    position: null,
    state: null
};

var tracking = {
    'track_id': [],
    'state': []
};

tracking['track_id'].push(vault_keeper);

var pulse;

(function heartbeat() {

    clearTimeout(pulse);
    pulse = setTimeout(function() {

        var dirty = false;

        spotify_daemon.getState(function(_error_, _state_) {
            if (_error_) return heartbeat();

            Object.keys(tracking).forEach(function(key) {

                if (_state_[key] != state[key]) {

                    dirty = true;
                    console.log(key, ":", state[key], "->", _state_[key]);

                    tracking[key].forEach(function(callback, index) {
                        if (typeof callback === 'function')
                            callback(_state_[key]);
                    });
                }
            });
            //if (!dirty) console.log("3>heartbeat<3");
            state = _state_;
            return heartbeat();
        });
    }, 2000);
})();

function vault_keeper(_trackID_) {

    console.log("Checking", "./db/" + _trackID_);

    jsonfile.readFile("./db/" + _trackID_, function(err, obj) {

        //if (err) return golden_retriever(_trackID_);
        //if (obj.score > 12) return golden_retriever(_trackID_);

        //console.log("Found Track:", _trackID_,"("+ obj["song"]["name"]+") matched to YT ID:", obj["video"]["urlShort"],"("+ obj["video"]["title"]+") | SCORE:", obj["score"]);
        return golden_retriever(_trackID_);
    });
}

function golden_retriever(_trackID_) {

    console.log("Retrieving", _trackID_);

    spotify_daemon.getTrack(function(_error_, _track_) {
        if (_error_) return console.log("The puppy got lost yo");

        return search_your_tube(_track_, save_the_baby);
    });
}

function save_the_baby(_error_, _newborn_) {
    if (_error_) return console.log(_error_);

    console.log("Saving Track:", _newborn_["song"]["id"], "(" + _newborn_["song"]["name"] + ") matched to YT ID:", _newborn_["video"]["urlShort"], "(" + _newborn_["video"]["title"] + "|" + _newborn_["video"]["channelTitle"] + ") | SCORE:", _newborn_["score"]);
    console.log(_newborn_["video"]["urlLong"]);


    //some vids crash the fucking app, e.g L$D asap fucking pls
    // ytdl(_newborn_["video"]["urlLong"], { filter: function(format) { return format.container === 'mp4'; } })
    //     .pipe(fs.createWriteStream("./vault/"+_newborn_["song"]["name"] +".mp4"));
    
    //Configure YoutubeMp3Downloader with your settings
    var YD = new YoutubeMp3Downloader({
        "ffmpegPath": "./ffmpeg/ffmpeg", // Where is the FFmpeg binary located?
        "outputPath": "./vault", // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest", // What video quality should be used?
        "queueParallelism": 2, // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000 // How long should be the interval of the progress reports
    });
    //Download video and save as MP3 file
    YD.download( _newborn_["video"]["id"], (_newborn_["song"]["name"]+"-"+_newborn_["song"]["artist"]).replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')+".mp3");
    YD.on("finished", function(data) {
        console.log(data);
    });
    YD.on("error", function(error) {
        console.log(error);
    });
    // YD.on("progress", function(progress) {
    //     console.log(progress);
    // });

    jsonfile.writeFile("./db/" + _newborn_["song"]["id"], _newborn_, {
        spaces: 2
    }, function(err) {
        console.error(err);
    });

}
// Search Youtube -- callback is called on each found item
function search_your_tube(_track_, callback) {

    var query = _track_["name"] + " + " + _track_["artist"] + (_track_["album_artist"] == _track_["artist"] ? "" : " + " + _track_["album_artist"]);
    console.log(_track_);
    console.log("Searching query:", query);

    Youtube.search.list({
            part: 'snippet',
            type: 'video',
            q: query,
            maxResults: 50,
            order: 'viewcount', //viewCount relevance rating
            //safeSearch: 'moderate',
            videoEmbeddable: true
        },
        _tubeHandler
    );

    function _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, invertedOrderScore) {

        var score = 0;

        if (nameInTitle) {
            score += 1;

        } else {
            score += -1;
        }

        if (artistInTitle) {
            score += 1;

        } else {
            score += -1;
        }

        if (isAudio) {
            score += -1;
        }
        if (isLyric) {
            score += -1;
        }
        if (isCredit) {
            score += -1;
        }
        if (isLive) {
            score += -1;
        }


        if (isOfficial) {
            score += 1;
        }
        if (isMusic) {
            score += 1;
        }
        if (isVideo) {
            score += 1;
        }
        if (isExplicit) {
            score += 1;
        }

        score += simiScore;
        score += nameInTitleScore;

        score += channelScore;

        score *= invertedOrderScore;

        return score;
    }

    function _standardizeString(str) {
        //replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
        //return str

        return str.replace(/\s/gi, '').toLowerCase();
    }

    function _tubeHandler(err, res) {
        if (err) {
            return callback(err);
        }
        //the sperms showndown
        var suppaWilly = null;
        var suppaWillyScore = -999999999; //bigger better

        var spermsTotal = res.items.length;
        var spermsCount = res.items.length;

        if (spermsCount < 1) {
            console.log("hopeless pursue in the wilderness");
            return callback("Empty Search");
        }
        console.log("spermsCount:", spermsCount);
        res.items.forEach(function(result) {
            var video = {
                id: result.id.videoId,
                urlShort: 'http://youtu.be/' + result.id.videoId,
                urlLong: 'http://www.youtube.com/watch?v=' + result.id.videoId,
                published: result.snippet.publishedAt,
                title: result.snippet.title || '',
                description: result.snippet.description || '',
                images: result.snippet.thumbnails,
                channelTitle: result.snippet.channelTitle,
                channelId: result.snippet.channelId,
                live: result.snippet.liveBroadcastContent || ''
            };
            Youtube.videos.list({
                    part: 'contentDetails',
                    id: video.id
                },
                function(err2, data) {
                    if (err2) {

                        spermsCount--;
                        if (spermsCount < 1) {
                            if (suppaWilly === null)
                                callback(err2);
                            else
                                callback(null, {
                                    "song": _track_,
                                    "video": suppaWilly,
                                    "score": suppaWillyScore

                                });
                            //callback = null;
                            return;
                        }
                        return;
                    }

                    if (data.items.length >= 1) {

                        data.items[0].contentDetails.duration.replace(/PT(\d+)M(\d+)S/, function(t, m, s) {
                            video.duration = ((parseInt(m, 10) * 60) + parseInt(s, 10)) * 1000; //unit in ms
                        });

                        video.definition = data.items[0].contentDetails.definition;
                        var timeDiff = Math.abs(video['duration'] - _track_['duration']);

                        var vidTitle = _standardizeString(video["title"]);

                        var lavenD = leven(_standardizeString(_track_["artist"] + " - " + _track_["name"] + " official music video"), vidTitle);

                        var nameInTitleScore = vidTitle.score(_standardizeString(_track_["name"]), 0.5) * 3;

                        var nameInTitle = vidTitle.indexOf(_standardizeString(_track_["name"])) > -1;
                        var artistInTitle = vidTitle.indexOf(_standardizeString(_track_["artist"])) > -1;


                        var isAudio = vidTitle.indexOf("audio") > -1;
                        var isLyric = vidTitle.indexOf("lyric") > -1;
                        var isCredit = vidTitle.indexOf("credit") > -1;
                        var isLive = vidTitle.indexOf("live") > -1;

                        var isOfficial = vidTitle.indexOf("official") > -1;
                        var isMusic = vidTitle.indexOf("music") > -1;
                        var isVideo = vidTitle.indexOf("video") > -1;
                        var isExplicit = vidTitle.indexOf("explicit") > -1;

                        var simiScore = (1 - (lavenD / 100));
                        var channelScore = 0;
                        if (video["channelTitle"] !== "") {
                            channelScore = _standardizeString(video["channelTitle"]).score(_standardizeString(_track_["artist"]), 0.5) * 3;
                        }
                        var invertedOrderScore = spermsCount / spermsTotal;


                        var tempScore = _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, invertedOrderScore);


                        if (nameInTitle || (nameInTitleScore > 1)) {

                            console.log(tempScore, channelScore, video["title"], video["channelTitle"], video["urlShort"]);

                            var shouldUseNewResult = true;
                            if (tempScore === suppaWillyScore) {
                                var currTimeDiff = Math.abs(suppaWilly['duration'] - _track_['duration']);

                                shouldUseNewResult = (timeDiff < currTimeDiff);
                                console.log("shouldUseNewResult:", shouldUseNewResult, timeDiff, currTimeDiff);
                            }
                            if (tempScore >= suppaWillyScore && shouldUseNewResult) {
                                suppaWillyScore = tempScore;
                                suppaWilly = video;
                            }
                        }

                    } else {
                        console.log("no new born damn");
                    }

                    spermsCount--;
                    if (spermsCount < 1) {
                        if (suppaWilly === null)
                            callback("Empty Search");
                        else
                            callback(null, {
                                "song": _track_,
                                "video": suppaWilly,
                                "score": suppaWillyScore
                            });
                        //callback = null;
                        return;
                    }

                }
            );
        });

    }
}
app.listen(port);
console.log('Express app started on port ' + port);