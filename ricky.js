require("string_score");
var leven = require('leven');
var Q = require('q');


function _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, statsScore, invertedOrderScore) {

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
    if (isCover) {
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
    score += statsScore;
    score *= invertedOrderScore;

    return score;
}

function _calculateStatScore(statsObj) {

    var ret = {
        viewCount: 0,
        likeCount: 0,
        dislikeCount: 0,
        favoriteCount: 0,
        commentCount: 0,
        score: 0
    };

    if (typeof statsObj === 'undefined') {
        return ret;
    }

    ret.dislikeCount = (typeof statsObj.dislikeCount !== 'undefined') ? parseInt(statsObj.dislikeCount, 10) : 0;


    ret.viewCount = ((typeof statsObj.viewCount !== 'undefined') ? parseInt(statsObj.viewCount, 10) : 0) - ret.dislikeCount;

    ret.likeCount = ((typeof statsObj.likeCount !== 'undefined') ? parseInt(statsObj.likeCount, 10) : 0) - ret.dislikeCount;

    ret.favoriteCount = (typeof statsObj.favoriteCount !== 'undefined') ? parseInt(statsObj.favoriteCount, 10) : 0;
    ret.commentCount = (typeof statsObj.commentCount !== 'undefined') ? parseInt(statsObj.commentCount, 10) : 0;

    var viewCountThres = 500000;
    var likeCountThres = 12000;
    var favoriteThres = 1200;
    var commentThres = 120;

    if (ret.viewCount > 0) {

        ret.score += ret.viewCount > viewCountThres ? 3 : (1 / viewCountThres) * ret.viewCount * 3;
    }

    if (ret.likeCount > 0) {

        ret.score += ret.likeCount > likeCountThres ? 3 : (1 / likeCountThres) * ret.likeCount * 3;
    }

    ret.score += ret.favoriteCount > favoriteThres ? 1 : (1 / favoriteThres) * ret.favoriteCount;

    ret.score += ret.commentCount > commentThres ? 1 : (1 / commentThres) * ret.commentCount;

    return ret;
}

function _standardizeString(str) {
    //replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
    //return str

    return str.replace(/\s/gi, '').toLowerCase();
}


function _tubeHandler(_tube_, _track_, res) {

    var deferred = Q.defer();

    //the sperms showndown
    var suppaWilly = null;
    var suppaWillyScore = -999999999; //bigger better

    var spermsTotal = res.items.length;

    if (spermsTotal < 1) {
        console.log("hopeless pursue in the wilderness");
        deferred.reject("Empty Search");
    }
    console.log("spermsCount:", spermsTotal);


    function _fuckfakerism(video, pos, data) {


        if (data.items.length < 1) {
            return new Error("Baby Doesnt Have Info Such as BirthDate(creation date)");
        }

        data.items[0].contentDetails.duration.replace(/PT(\d+)M(\d+)S/, function(t, m, s) {
            video.duration = ((parseInt(m, 10) * 60) + parseInt(s, 10)) * 1000; //unit in ms
        });

        video.definition = data.items[0].contentDetails.definition;
        var timeDiff = Math.abs(video['duration'] - _track_['duration']);

        var vidTitle = _standardizeString(video["title"]);

        var lavenD = leven(_standardizeString(_track_["artist"] + " - " + _track_["name"] + " official music video"), vidTitle);

        var nameInTitleScore = vidTitle.score(_standardizeString(_track_["name"]), 1) * 3;

        var nameInTitle = vidTitle.indexOf(_standardizeString(_track_["name"])) > -1;
        var artistInTitle = vidTitle.indexOf(_standardizeString(_track_["artist"])) > -1;


        var isAudio = vidTitle.indexOf("audio") > -1;
        var isLyric = vidTitle.indexOf("lyric") > -1;
        var isCredit = vidTitle.indexOf("credit") > -1;
        var isLive = vidTitle.indexOf("live") > -1;
        var isCover = (vidTitle.indexOf("cover") > -1) || (vidTitle.indexOf("react") > -1) || (vidTitle.indexOf("response") > -1);

        var isOfficial = vidTitle.indexOf("official") > -1;
        var isMusic = vidTitle.indexOf("music") > -1;
        var isVideo = vidTitle.indexOf("video") > -1;
        var isExplicit = vidTitle.indexOf("explicit") > -1;

        var simiScore = (1 - (lavenD / 100));
        var channelScore = 0;
        if (video["channelTitle"] !== "") {

            channelScore = _standardizeString(video["channelTitle"]).score(_standardizeString(_track_["artist"]), 1) * 3;
        }
        var invertedOrderScore = (spermsTotal - pos) / spermsTotal;

        var stats = _calculateStatScore(data.items[0].statistics);

        var tempScore = _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, stats.score, invertedOrderScore);

        // console.log("nameInTitle:", nameInTitle, "nameInTitleScore:", nameInTitleScore, video["title"], video["channelTitle"], video["urlShort"]);

        if (nameInTitle || (nameInTitleScore > 0.95)) {

            //   console.log("tempScore:", tempScore, "channelScore:", channelScore, video["title"], video["channelTitle"], video["urlShort"]);

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


        return {
            video: video,
            score: tempScore
        };
    }

    var collector = [];
    res.items.forEach(function(result, pos) {

        var each_data_deferred = Q.defer();

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
                part: 'contentDetails,statistics',
                id: video.id
            },
            function(err, data) {
                if (err) {
                    each_data_deferred.reject(err);
                } else {
                    each_data_deferred.resolve(_fuckfakerism(video, pos, data));
                }
            }
        );
        collector.push(each_data_deferred.promise);

    });


    Q.allSettled(collector)
        .then(function(results) {
            deferred.resolve({
                "video": suppaWilly,
                "score": suppaWillyScore
            });
            // results.forEach(function(result) {
            //     if (result.state === "fulfilled") {
            //         var value = result.value;
            //         console.log(value);
            //     } else {
            //         var reason = result.reason;
            //         console.log(reason);

            //     }
            // });

        });

    return deferred.promise;

}


var Ricky = function(tube){

    var self = this;
    self.tube = tube;
};

Ricky.prototype.search_your_tube = function(_track_){

    var self = this;
    var deferred = Q.defer();

    var query = _track_["name"] + " + " + _track_["artist"] + (_track_["album_artist"] == _track_["artist"] ? "" : " + " + _track_["album_artist"]);
    console.log(_track_);
    var order = (Math.random() < 0.5 ? 'relevance' : 'viewCount'); //rating
    console.log("Searching query(orderBY ", order, "):", query);
    self.tube.search.list({
            part: 'snippet',
            type: 'video',
            q: query,
            maxResults: 50,
            order: order, //viewCount relevance rating
            //safeSearch: 'moderate',
            videoEmbeddable: true
        },
        function(err, res) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                deferred.resolve(_tubeHandler(self.tube, _track_, res));
            }
        }
    );

    return deferred.promise;
};

module.exports = Ricky;



