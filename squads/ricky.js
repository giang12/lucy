"use strict";

require("string_score");
var leven = require('leven');
var Q = require('q');
var make = require('./lib/make.js');
var Cache = require("node-cache");

var _compare = null;
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
function _defaultCompare(newScore, oldScore, strictly) {

    if (strictly) {
        return newScore.score > oldScore.score && newScore.percent > oldScore.percent;
    }
    return newScore.score >= oldScore.score && newScore.percent >= oldScore.percent;
}

function Ricky(compare, tube, name) {

    var self = this;
    self.name = name || ("Ricky<" + Math.random().toString() + ">");
    self.tube = tube;
    if (typeof compare !== "function") {
        console.log("No compare function supplied, using default");
        _compare = _defaultCompare;
    } else {
        _compare = compare;
    }

    return self;
}
Ricky.prototype.changeTube = function(tube) {

    var self = this;
    self.tube = tube;
    return self;
};


/**
 * We set cache on successful tube checking 
 * because when we have a match, it is least likely to change to some time
 * at least for some live stats to change
 */
//search_your_tube cache
//query is key
//Store Willy {video:,score:}
var Eva = new Cache({
        stdTTL      : 24 * 60 * 60, //24 hours,
        checkperiod : 1 * 60 * 60,
        useClones   : true
    })
    .on("set", function(key, value) {
        // ... do something ...   
        console.log("Eva cache", key);
        console.log("For the functioning of search_your_tube", "Stat:", Eva.getStats());
    })
    .on("del", function(key, value) {
        // ... do something ...   
        console.log("Eva del", key, "from search_your_tube cache");
        console.log("Stat: ", Eva.getStats());
    })
    .on("expired", function(key, value) {
        // ... do something ...   
        console.log(key, "in search_your_tube cache expired");
        console.log("Stat: ", Eva.getStats());
    })
    .on("flush", function() {
        // ... do something ...   
        console.log("Eva flushed the cache for search_your_tube");
        console.log("Stat: ", Eva.getStats());
    });

/**
 * [search_your_tube description]
 * @param  {[type]} _track_ [description]
 * var song = {
            "breadcrumb": "Lucy:Giang@github/giang12:nggiang12@gmail",
            "artist": artist,
            "author": artist,
            "albumartist": artist,
            "album": _track_.album.name,
            "disc": _track_.disc_number,
            "track": _track_.track_number,
            "popularity": _track_.popularity,
            "id": _track_.id,
            "title": _track_.name,
            "spotify_uri": _track_.uri,
            "images": _track_.album.images,
            "duration": _track_.duration_ms,
            "explicit": _track_.explicit,
            "grouping": "",
            "composer": "",
            "year": "",
            "comment": "",
            "genre": "",
            "copyright": "",
            "description": "",
            "lyrics": ""
        };
 * @return {[type]}         [description]
 */
Ricky.prototype.search_your_tube = function(_song_) {
    //check cache before committing to deep shit or search lol
    var query = _makeQuery(_song_);
    var self = this;

    var cache_willy = Eva.get(query);
    if (cache_willy !== undefined) {

        console.log(self.name, "found a cache for", _song_.id, "matched to", cache_willy.title, cache_willy.urlLong);
        
        return Q.resolve(cache_willy);
    }

    var deferred = Q.defer();

    var orders = ["relevance", "viewCount", "rating"];

    console.log(self.name, "is about to search for", _song_.id, "a.k.a", query);

    var _aggregatedResults = [];
    orders.forEach(function(_order_){
        _aggregatedResults.push(_search_by_order(self, query, _order_));
    });

    _dedup_search_results(_aggregatedResults)
        .then(function(data) {

            console.log(self.name, "is picking best match for", _song_.id, "a.k.a", query, "from", data.uniqCount, "unique result(s)[outOf", data.origCount, "]");
            _pick_best_match(self, _song_, data.uniqResult)
                .then(
                    function _foundWilly(Willy) {

                        Eva.set(query, Willy);
                        deferred.resolve(Willy);

                    }, function _noWill(reason) {

                        deferred.reject(reason);
                    }).done();
        }).done();
    
    return deferred.promise;
};

module.exports = Ricky;


function _makeQuery(_song_) {

    return _song_.title + " + " + _song_.artist;
}

function _search_by_order(self, _query_, _order_) {
    
    var deferred = Q.defer();

    console.log(self.name, "is searching for", _query_, "(orderBY", _order_, ")");

    self.tube.search.list({
            part: 'snippet',
            type: 'video',
            q: _query_,
            maxResults: 50,
            order: _order_, //viewCount relevance rating
            //safeSearch: 'moderate',
            videoEmbeddable: true
        },
        function(err, res) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                deferred.resolve(res.items);
            }
        }
    );

    return deferred.promise;
}

/**
 * [_dedup_search_results description]
 * @param  {[type]} _origResults_ [array of promised results]
 * @return deferred.resolve({
 *              origCount: _totalItems,
 *              uniqCount: _dedupedResults.length,
 *              uniqResult: _dedupedResults
 *           })               
 *   [description]
 */
function _dedup_search_results(_promisedResults_){

    var deferred = Q.defer();
    var _tmp = [];
    var _dedupedResults = [];
    var _totalItems = 0;

    Q.allSettled(_promisedResults_)
        .then(function(results) {
            results.forEach(function(result) {

                if (result.state === "fulfilled") {

                    _totalItems += result.value.length;
                    result.value.forEach(function(item){
                        //filter out duped item
                        if(_tmp.indexOf(item.id.videoId) < 0){
                            _tmp.push(item.id.videoId);
                            _dedupedResults.push(item);
                        }
                    });
                }
            });
            return deferred.resolve({
                origCount: _totalItems,
                uniqCount: _dedupedResults.length,
                uniqResult: _dedupedResults
            });
        }).done();

    return deferred.promise;

}


/**
 * down here are the picking majic stuff, refactor when have time
 */
/**
 * Score History:
 * a) 13: only use keywords
 * b) 21: added stats (viewcount, likecount....)
 * c) 27: added stats perday(view count, likecount)
 * @type {Number}
 */
var MAX_SCORE = 27;

function _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isTeaser, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, statsScore, invertedOrderScore) {

    var score = 0;
    var percent = 0;

    //best right best 2
    score += nameInTitle ? 1 : -1;
    score += artistInTitle ? 1 : -1;

    //best left best 0
    score += isAudio ? -1 : 0;
    score += isLyric ? -1 : 0;
    score += isCredit ? -1 : 0;
    score += isLive ? -1 : 0;
    score += isCover ? -1 : 0;
    score += isTeaser ? -1 : 0;

    //best right best 4
    score += isOfficial ? 1 : 0;
    score += isMusic ? 1 : 0;
    score += isVideo ? 1 : 0;
    score += isExplicit ? 1 : 0;


    score += simiScore; //max 1

    score += nameInTitleScore; //max 3
    score += channelScore; //max 3
    score += statsScore; //max 14

    score *= invertedOrderScore;

    percent = Math.round((score / MAX_SCORE) * 1000) / 1000;
    score = Math.round(score * 1000) / 1000;

    return {
        maxScore: MAX_SCORE,
        score: score,
        percent: percent
    };
}

function _calculateStatScore(statsObj, publishedDate) {

    var ret = {
        viewCount: 0,
        viewCount_perday: 0,
        likeCount: 0,
        likeCount_perday: 0,
        dislikeCount: 0,
        favoriteCount: 0,
        commentCount: 0,
        score: 0 //Max 14
    };
    if (typeof statsObj === 'undefined') {
        return ret;
    }

    ret.dislikeCount = (typeof statsObj.dislikeCount !== 'undefined') ? parseInt(statsObj.dislikeCount, 10) : 0;

    ret.viewCount = ((typeof statsObj.viewCount !== 'undefined') ? parseInt(statsObj.viewCount, 10) : 0) - ret.dislikeCount;
    ret.likeCount = ((typeof statsObj.likeCount !== 'undefined') ? parseInt(statsObj.likeCount, 10) : 0) - ret.dislikeCount;

    ret.favoriteCount = (typeof statsObj.favoriteCount !== 'undefined') ? parseInt(statsObj.favoriteCount, 10) : 0;
    ret.commentCount = (typeof statsObj.commentCount !== 'undefined') ? parseInt(statsObj.commentCount, 10) : 0;

    var viewCountThres  = 1200000; //1.2mill
    var likeCountThres  = 12000; //12k
    var favoriteThres   = 1200;
    var commentThres    = 120;

    var viewCount_perdayThres = 500000; //500k
    var likeCount_perdayThres = 5000; //5k

    if (ret.viewCount > 0) {
        ret.score += ret.viewCount > viewCountThres ? 3 : (1 / viewCountThres) * ret.viewCount * 3; //Max 3
    }

    if (ret.likeCount > 0) {

        ret.score += ret.likeCount > likeCountThres ? 3 : (1 / likeCountThres) * ret.likeCount * 3; //Max 3
    }
    try {
        var dayDiff = make.timeDiff(new Date(publishedDate), new Date(), 'd');
        ret.viewCount_perday = ret.viewCount / dayDiff; 
        ret.likeCount_perday = ret.likeCount / dayDiff;

        ret.score += ret.viewCount_perday > viewCount_perdayThres ? 3 : (1 / viewCount_perdayThres) * ret.viewCount_perday * 3; //Max 3
        ret.score += ret.likeCount_perday > likeCount_perdayThres ? 3 : (1 / likeCount_perdayThres) * ret.likeCount_perday * 3; //Max 3

    } catch (e) {
        //date is invalid, no bonus point for you
        console.log(e);
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


function _pick_best_match(_ricky_, _track_, _results_) {

    if (typeof _ricky_.tube !== 'function') {

        return Q.reject(new Error("Invalid Tube"));
    }
    var deferred = Q.defer();

    //the sperms showndown
    var suppaWilly = null;
    var suppaWillyScore = {
        maxScore: MAX_SCORE,
        score: -999999999, //bigger better
        percent: 0,
    };

    var spermsTotal = _results_.length;

    if (spermsTotal < 1) {

        console.log("hopeless pursue in the wilderness");
        return Q.reject(new Error("hopeless pursue in the wilderness"));
    }
    console.log("spermsCount:", spermsTotal);
    var collector = [];
    _results_.forEach(function(result, pos) {

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
        }).done();


    function _fuckfakerism(video, pos, data) {


        if (data.items.length < 1) {

            return new Error("Baby Doesnt Have Info Such as BirthDate(creation date)");
        }

        data.items[0].contentDetails.duration.replace(/PT(\d+)M(\d+)S/, function(t, m, s) {
            video.duration = ((parseInt(m, 10) * 60) + parseInt(s, 10)) * 1000; //unit in ms
        });
        video.definition = data.items[0].contentDetails.definition;

        var timeDiff = Math.abs(video['duration'] - _track_['duration']); //may use timeDiff as one of the scoring thing
        var vidTitle = _standardizeString(video["title"]);
        //laven score for vid title
        var lavenD = leven(_standardizeString(_track_["artist"] + " - " + _track_["title"] + " official music video"), vidTitle);


        //g1
        var nameInTitle = vidTitle.indexOf(_standardizeString(_track_["title"])) > -1;
        var artistInTitle = vidTitle.indexOf(_standardizeString(_track_["artist"])) > -1;

        //g2
        var isAudio = vidTitle.indexOf("audio") > -1;
        var isLyric = vidTitle.indexOf("lyric") > -1;
        var isCredit = vidTitle.indexOf("credit") > -1;
        var isLive = vidTitle.indexOf("live") > -1;
        var isCover = (vidTitle.indexOf("cover") > -1) || (vidTitle.indexOf("react") > -1) || (vidTitle.indexOf("response") > -1);
        var isTeaser = vidTitle.indexOf("teaser") > -1;

        //g3
        var isOfficial = vidTitle.indexOf("official") > -1;
        var isMusic = vidTitle.indexOf("music") > -1;
        var isVideo = vidTitle.indexOf("video") > -1;
        var isExplicit = vidTitle.indexOf("explicit") > -1;

        var nameInTitleScore = vidTitle.score(_standardizeString(_track_["title"]), 1) * 3; //Max 3
        var simiScore = (1 - (lavenD / 100)); //Max 1
        var channelScore = 0; //Max 3

        if (video["channelTitle"] !== "") {

            channelScore = _standardizeString(video["channelTitle"]).score(_standardizeString(_track_["artist"]), 1) * 3;
        }
        var invertedOrderScore = (spermsTotal - pos) / spermsTotal; //Max 1

        var stats = _calculateStatScore(data.items[0].statistics, video.published); //Max 8

        var tempScore = _calculateScore(nameInTitle, artistInTitle, isAudio, isLyric, isCredit, isLive, isCover, isTeaser, isOfficial, isMusic, isVideo, isExplicit, simiScore, nameInTitleScore, channelScore, stats.score, invertedOrderScore);

        //console.log("nameInTitle:", nameInTitle, "nameInTitleScore:", nameInTitleScore, video["title"], video["channelTitle"], video["urlShort"]);

        //if (nameInTitle || (nameInTitleScore > 0.95)) {

        //console.log("tempScore:", tempScore, "channelScore:", channelScore, video["title"], video["channelTitle"], video["urlShort"]);

        var shouldUseNewResult = true;

        /** if two scores are equal pick the one that match duration best */
        if (tempScore.score === suppaWillyScore.score) {
            var currTimeDiff = Math.abs(suppaWilly['duration'] - _track_['duration']);
            shouldUseNewResult = (timeDiff < currTimeDiff);
            //console.log("shouldUseNewResult:", shouldUseNewResult, timeDiff, currTimeDiff);
        }

        if (_compare(tempScore, suppaWillyScore) && shouldUseNewResult) {
            suppaWillyScore = tempScore;
            suppaWilly = video;
        }
        //}


        return {
            video: video,
            score: tempScore
        };
    }

    return deferred.promise;
}

