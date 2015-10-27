/**
 * Given search channels, and trackID -> retrieve available media
 * 
 * @param  {[String]} _trackID_ [song ID]
 * @param  {[Func]} _tube_    [Youtube Channel] media type video
 * @return {[Object]}    Track_info record
 * 
 {
  "song": {
    "artist": "Broods",
    "album": "Evergreen",
    "disc_number": 1,
    "duration": 252000,
    "played_count": 0,
    "track_number": 6,
    "popularity": 55,
    "id": "spotify:track:0ZyNhzQtb8sDCOaHt46I0o",
    "name": "Never Gonna Change",
    "album_artist": "Broods",
    "spotify_url": "spotify:track:0ZyNhzQtb8sDCOaHt46I0o"
  },
  paths: { //Path to local files will be set by Fred after succesfully download
        yt_vid: null,
        yt_aud: null
    },
  "youtube": {
    "id": "9QrCFSJyabs",
    "urlShort": "http://youtu.be/9QrCFSJyabs",
    "urlLong": "http://www.youtube.com/watch?v=9QrCFSJyabs",
    "published": "2014-03-05T00:00:01.000Z",
    "title": "Broods - Never Gonna Change",
    "description": "Debut album 'Evergreen' available now http://smarturl.it/egreen Follow Broods: https://www.facebook.com/broodsmusic https://twitter.com/broodsmusic ...",
    "images": {
      "default": {
        "url": "https://i.ytimg.com/vi/9QrCFSJyabs/default.jpg"
      },
      "medium": {
        "url": "https://i.ytimg.com/vi/9QrCFSJyabs/mqdefault.jpg"
      },
      "high": {
        "url": "https://i.ytimg.com/vi/9QrCFSJyabs/hqdefault.jpg"
      }
    },
    "channelTitle": "BroodsVEVO",
    "channelId": "UCIcCIyONDlhG49BJc3u38Vg",
    "live": "none",
    "duration": 255000,
    "definition": "hd",
    "score": {
      "maxScore": 26,
      "score": 14.129,
      "percent": 0.543
    }
  }
}
 */
var Ricky = new(require('./ricky.js'))();
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var Q = require('q');

var golden_retriever = function() {

    function _fetch(_trackID_, _tube_) {

        var deferred = Q.defer();

        console.log("Retrieving", _trackID_);

        spotify_daemon.getTrack(function(_error_, _track_) {

            if (_error_) return deferred.reject(new Error("The puppy got lost yo"));

            var ret = {
                song: _track_,
                paths: {
                    yt_vid: null,
                    yt_aud: null
                },
                youtube: null,
            };

            Ricky.changeTube(_tube_).search_your_tube(_track_)
                .then(function success(value) {
                        //console.log(value);
                        ret.youtube = value;
                        //this is where we get the images welp
                        // (Ethel.getSpotifyApi()).getTrack("0kWaHSRR5RK4nJk25AN8Yv")
                        //     .then(
                        //         function(val) {
                        //             console.log(val.body);
                        //         }, function(reason) {
                        //             console.log(reason);
                        //         }
                        // ).done();
                        deferred.resolve(ret);

                    },
                    function error(reason) {
                        deferred.reject(new Error(reason));
                    });
        });

        return deferred.promise;
    }
    return {
        fetch: _fetch,
        bark: function() {

            return "bark";
        }
    };
};

module.exports = golden_retriever();