require("string_score");
var leven = require('leven');


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


function _tubeHandler(_tube_, _track_, callback, err, res) {

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

        _tube_.videos.list({
                part: 'contentDetails',
                id: video.id
            },
            function(err, data) {
                return _fuckfakerism(video, err, data);
            }
        );
    });


    function _fuckfakerism(video, err2, data) {

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

            //console.log("nameInTitle:", nameInTitle, "nameInTitleScore:",nameInTitleScore, video["title"], video["channelTitle"], video["urlShort"]);

            if (nameInTitle || (nameInTitleScore > 0.95)) {

                //console.log("tempScore:", tempScore, "channelScore:", channelScore, video["title"], video["channelTitle"], video["urlShort"]);

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

}

// Search Youtube -- callback is called on each found item
/**
 * [search_your_tube description]
 * @param  {[type]}   _tube_   [description]
 * @param  {[type]}   _track_  [description]
 * @param  {Function} callback [description]
 * @return      {
                    "song": _track_,
                    "video": suppaWilly,
                    "score": suppaWillyScore
                }
 */
exports.search_your_tube = function(_tube_, _track_, callback) {

    var query = _track_["name"] + " + " + _track_["artist"] + (_track_["album_artist"] == _track_["artist"] ? "" : " + " + _track_["album_artist"]);
    console.log(_track_);
    console.log("Searching query:", query);

    _tube_.search.list({
            part: 'snippet',
            type: 'video',
            q: query,
            maxResults: 50,
            order: 'viewcount', //viewCount relevance rating
            //safeSearch: 'moderate',
            videoEmbeddable: true
        },
        function(err, res) {
            return _tubeHandler(_tube_, _track_, callback, err, res);
        }
    );
};