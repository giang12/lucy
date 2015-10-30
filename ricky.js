require("string_score");
var leven = require('leven');
var Q = require('q');

var _compare =  function (newScore, oldScore, strictly) {

        if (strictly) {
            return newScore.score > oldScore.score && newScore.percent > oldScore.percent;
        }
        return newScore.score >= oldScore.score && newScore.percent >= oldScore.percent;
    };
/**
 * Responsible for searching youtube
 * @param {[type]} name    [his name]
 * @param {[type]} compare [method to compare between 2 results]
 *                         Given (scoreObj1, scoreObj2[, strict])
 *                         should return true is score1 is better than 2 false orderwise,
 *                         if strict === true, should compare stricly greater than
 *                         otherwise greater than or equal will suffice
 *                         Score Obj:
 *                          {
                                maxScore: total,
                                score: score,
                                percent: percent
                            }
 * 
 * @param {[type]} tube    [description]
 * 
 */
function Ricky(compare, tube, name) {

    var self = this;
    self.name = name || ("Ricky<" + Math.random().toString() + ">");
    self.tube = tube;
   // _compare = compare || ;
    return self;
}
Ricky.prototype.changeTube = function(tube) {

    var self = this;
    self.tube = tube;
    return self;
};
/**
 * [search_your_tube description]
 * @param  {[type]} _track_ [description]
 * var song = {
            "artist": artist,
            "album": _track_.album.name,
            "disc_number": _track_.disc_number,
            "track_number": _track_.track_number,
            "popularity": _track_.popularity,
            "id": _track_.id,
            "title": _track_.name,
            "spotify_uri": _track_.uri,
            "images": _track_.album.images,
            "duration_ms": _track_.duration_ms,
            "explicit": _track_.explicit
        };
 * @return {[type]}         [description]
 */
Ricky.prototype.search_your_tube = function(_song_) {

    var self = this;
    var deferred = Q.defer();
    //console.log(_song_);
    var order = _whichOrder();
    var query = _makeQuery(_song_);

    console.log(self.name, "is searching for", _song_.id , "a.k.a", query ,"(orderBY", order,")");

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
                deferred.resolve(_tubeHandler(self, _song_, res));
            }
        }
    );

    return deferred.promise;
};

module.exports = Ricky;


function _makeQuery(_song_) {

    return _song_.title + " + " + _song_.artist;
}

function _whichOrder() {
    //'relevance' : 'viewCount' : rating
    return (Math.random() < 0.5 ? 'relevance' : 'viewCount');
}

function _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, statsScore, invertedOrderScore) {

    var score = 0;
    var percent = 0;
    var total = 26; // 11 boos + 1 simi + 3 namescore + 3 chanel score + 8 statsscore excludde invertedOrderScore

    score += nameInTitle ? 1 : -1;
    score += artistInTitle ? 1 : -1;

    score += isAudio ? -1 : 0;
    score += isLyric ? -1 : 0;
    score += isCredit ? -1 : 0;
    score += isLive ? -1 : 0;
    score += isCover ? -1 : 0;

    score += isOfficial ? 1 : 0;
    score += isMusic ? 1 : 0;
    score += isVideo ? 1 : 0;
    score += isExplicit ? 1 : 0;


    score += simiScore;

    score += nameInTitleScore;
    score += channelScore;
    score += statsScore;

    score *= invertedOrderScore;

    percent = Math.round((score / total) * 1000) / 1000;
    total = Math.round(total * 1000) / 1000;
    score = Math.round(score * 1000) / 1000;

    return {
        maxScore: total,
        score: score,
        percent: percent
    };
}

function _calculateStatScore(statsObj) {

    var ret = {
        viewCount: 0,
        likeCount: 0,
        dislikeCount: 0,
        favoriteCount: 0,
        commentCount: 0,
        score: 0 //Max 8
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

        ret.score += ret.viewCount > viewCountThres ? 3 : (1 / viewCountThres) * ret.viewCount * 3; //Max 3
    }

    if (ret.likeCount > 0) {

        ret.score += ret.likeCount > likeCountThres ? 3 : (1 / likeCountThres) * ret.likeCount * 3; //Max 3
    }

    ret.score += ret.favoriteCount > favoriteThres ? 1 : (1 / favoriteThres) * ret.favoriteCount; //Max 1

    ret.score += ret.commentCount > commentThres ? 1 : (1 / commentThres) * ret.commentCount; //Max 1

    return ret;
}

function _standardizeString(str) {
    //replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
    //return str
    if (typeof str === 'undefined') return 'UNDEFINED';

    return str.replace(/\s/gi, '').toLowerCase();
}


function _tubeHandler(_ricky_, _track_, res) {

    if (typeof _ricky_.tube !== 'function') {

        return Q.reject(new Error("Invalid Tube"));
    }
    var deferred = Q.defer();

    //the sperms showndown
    var suppaWilly = null;
    var suppaWillyScore = {
        maxScore: 26,
        score: -999999999, //bigger better
        percent: 0,
    };

    var spermsTotal = res.items.length;

    if (spermsTotal < 1) {

        console.log("hopeless pursue in the wilderness");
        return Q.reject(new Error("hopeless pursue in the wilderness"));
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
        //laven score for vid title
        var lavenD = leven(_standardizeString(_track_["artist"] + " - " + _track_["title"] + " official music video"), vidTitle);


        var nameInTitle = vidTitle.indexOf(_standardizeString(_track_["title"])) > -1;
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

        //11 boo-> max 11
        var nameInTitleScore = vidTitle.score(_standardizeString(_track_["title"]), 1) * 3; //Max 3
        var simiScore = (1 - (lavenD / 100)); //Max 1
        var channelScore = 0; //Max 3
        if (video["channelTitle"] !== "") {

            channelScore = _standardizeString(video["channelTitle"]).score(_standardizeString(_track_["artist"]), 1) * 3;
        }
        var invertedOrderScore = (spermsTotal - pos) / spermsTotal; //Max 1

        var stats = _calculateStatScore(data.items[0].statistics); //Max 8

        //Max 26 (exclude invertedOrderScore only use for scaling)
        var tempScore = _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, stats.score, invertedOrderScore);

        // console.log("nameInTitle:", nameInTitle, "nameInTitleScore:", nameInTitleScore, video["title"], video["channelTitle"], video["urlShort"]);

        if (nameInTitle || (nameInTitleScore > 0.95)) {

            //   console.log("tempScore:", tempScore, "channelScore:", channelScore, video["title"], video["channelTitle"], video["urlShort"]);

            var shouldUseNewResult = true;

            if (tempScore.score === suppaWillyScore.score) {
                var currTimeDiff = Math.abs(suppaWilly['duration'] - _track_['duration']);
                shouldUseNewResult = (timeDiff < currTimeDiff);
                //console.log("shouldUseNewResult:", shouldUseNewResult, timeDiff, currTimeDiff);
            }
            if (_compare(tempScore, suppaWillyScore) && shouldUseNewResult) {
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
        //console.log(result);
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

        _ricky_.tube.videos.list({
                part: 'contentDetails,statistics',
                id: video.id
            },
            function(err, data) {
                if (err) {
                    each_data_deferred.reject(new Error(err));
                } else {
                    each_data_deferred.resolve(_fuckfakerism(video, pos, data));
                }
            }
        );
        collector.push(each_data_deferred.promise);

    });


    Q.allSettled(collector)
        .then(function(results) {
            //results is the list of results search with score attach
            //the winner should be set already or video is still null
            if (suppaWilly === null) {

                deferred.reject(new Error("Found " + results.length + " but no suitable match T_T"));
            } else {
                suppaWilly.score = suppaWillyScore;
                deferred.resolve(suppaWilly);
            }
        });

    return deferred.promise;

}