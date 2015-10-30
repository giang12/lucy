/**
 * Given search channels, and trackID(spotifyID) -> retrieve available media
 * 
 * @param  {[String]} _trackID_ [spotifyID eg 0eGsygTp906u18L0Oimnem]
 * but will also acceppt:
 *         URI spotify:track:0eGsygTp906u18L0Oimnem
 *         URL https://open.spotify.com/track/0eGsygTp906u18L0Oimnem
 *         
 * @param  {[Func]} _tube_    [Youtube Channel] media type video
 * @return {[Object]}    Track_info record
 * 
 {
  "song": {
    "artist": "Glass Animals",
    "album": "ZABA (Deluxe)",
    "disc_number": 1,
    "track_number": 15,
    "popularity": 48,
    "id": "43wtbrVn3ZSN8sz5MLgg4C",
    "name": "Cocoa Hooves - Stripped",
    "spotify_uri": "spotify:track:43wtbrVn3ZSN8sz5MLgg4C",
    "images": [
      {
        "height": 640,
        "url": "https://i.scdn.co/image/66215ec266abf79444a2890741da15bca0f23e3e",
        "width": 640
      },
      {
        "height": 300,
        "url": "https://i.scdn.co/image/fb9c311750328a9cca8b6bf823a1b4d94f5e8c79",
        "width": 300
      },
      {
        "height": 64,
        "url": "https://i.scdn.co/image/90e6149e9a5084f109a5fbeca9169168a740fe15",
        "width": 64
      }
    ],
    "duration_ms": 215458,
    "explicit": false
  },
  "fileName": "Cocoa Hooves - Stripped-Glass Animals",
  "paths": {
    "yt_vid": "../../Giang's Music/Lucy's Vault/track_video/Cocoa Hooves - Stripped-Glass Animals.mp4",
    "yt_aud": "../../Giang's Music/Lucy's Vault/track_audio/Cocoa Hooves - Stripped-Glass Animals.mp3"
  },
  "spotify": {
    "album": {
      "album_type": "album",
      "available_markets": [
        "CA",
        "MX",
        "US"
      ],
      "external_urls": {
        "spotify": "https://open.spotify.com/album/0dd6bX3CRdybDCgltyoItP"
      },
      "href": "https://api.spotify.com/v1/albums/0dd6bX3CRdybDCgltyoItP",
      "id": "0dd6bX3CRdybDCgltyoItP",
      "images": [
        {
          "height": 640,
          "url": "https://i.scdn.co/image/66215ec266abf79444a2890741da15bca0f23e3e",
          "width": 640
        },
        {
          "height": 300,
          "url": "https://i.scdn.co/image/fb9c311750328a9cca8b6bf823a1b4d94f5e8c79",
          "width": 300
        },
        {
          "height": 64,
          "url": "https://i.scdn.co/image/90e6149e9a5084f109a5fbeca9169168a740fe15",
          "width": 64
        }
      ],
      "name": "ZABA (Deluxe)",
      "type": "album",
      "uri": "spotify:album:0dd6bX3CRdybDCgltyoItP"
    },
    "artists": [
      {
        "external_urls": {
          "spotify": "https://open.spotify.com/artist/4yvcSjfu4PC0CYQyLy4wSq"
        },
        "href": "https://api.spotify.com/v1/artists/4yvcSjfu4PC0CYQyLy4wSq",
        "id": "4yvcSjfu4PC0CYQyLy4wSq",
        "name": "Glass Animals",
        "type": "artist",
        "uri": "spotify:artist:4yvcSjfu4PC0CYQyLy4wSq"
      }
    ],
    "available_markets": [
      "CA",
      "MX",
      "US"
    ],
    "disc_number": 1,
    "duration_ms": 215458,
    "explicit": false,
    "external_ids": {
      "isrc": "GB2DY1500105"
    },
    "external_urls": {
      "spotify": "https://open.spotify.com/track/43wtbrVn3ZSN8sz5MLgg4C"
    },
    "href": "https://api.spotify.com/v1/tracks/43wtbrVn3ZSN8sz5MLgg4C",
    "id": "43wtbrVn3ZSN8sz5MLgg4C",
    "name": "Cocoa Hooves - Stripped",
    "popularity": 48,
    "preview_url": "https://p.scdn.co/mp3-preview/38efc9695db1abefaf6046e4814d7adff759e68c",
    "track_number": 15,
    "type": "track",
    "uri": "spotify:track:43wtbrVn3ZSN8sz5MLgg4C"
  },
  "youtube": {
    "id": "Yvg--0TKqXw",
    "urlShort": "http://youtu.be/Yvg--0TKqXw",
    "urlLong": "http://www.youtube.com/watch?v=Yvg--0TKqXw",
    "published": "2015-08-23T18:13:49.000Z",
    "title": "Cocoa Hooves (Stripped)",
    "description": "Provided to YouTube by Universal Music Group International Cocoa Hooves (Stripped) · Glass Animals ZABA ℗ 2015 Wolf Tone Limited Released on: ...",
    "images": {
      "default": {
        "url": "https://i.ytimg.com/vi/Yvg--0TKqXw/default.jpg"
      },
      "medium": {
        "url": "https://i.ytimg.com/vi/Yvg--0TKqXw/mqdefault.jpg"
      },
      "high": {
        "url": "https://i.ytimg.com/vi/Yvg--0TKqXw/hqdefault.jpg"
      }
    },
    "channelTitle": "",
    "channelId": "UCfeJiV0Xu-C4z4DApRcznig",
    "live": "none",
    "duration": 216000,
    "definition": "hd",
    "score": {
      "maxScore": 26,
      "score": 1.271,
      "percent": 0.049
    }
  }
}
 */
"use strict";

function golden_retriever(name) {

    var spotify_daemon = require('./lib/spotify-node-applescript.js');
    var Q = require('q');

    var Ricky = new(require('./ricky.js'))(_is_first_record_score_better_than_2nd_one, null, "Rico");
    var Ethel = new(require('./ethel.js'))();


    var self = {
        name: name || ("Marco Polo<" + Math.random().toString() + ">"),
        sniff: _sniff,
        fetch: _fetch,
        bark: function() {

            return name + ": bark wolf bark";
        },
        isNewBetterThanOld: _is_first_record_score_better_than_2nd_one
    };
    return self;

    function _fetch(searchTerm, tube) {

        var q = _sniff(searchTerm);

        console.log(self.name, "is fetching for searchTerm", searchTerm, "<-before:after->", q);

        if (q === null) {
            return Q.reject(new Error("Invalid Track Id Yo"));
        }
        return _fetchWithID(Ricky.changeTube(tube), q);
    }
    /**
     * [_fetch description]
     * @param  {[string]} _trackID_ [spotifyID eg 0eGsygTp906u18L0Oimnem but will also acceppt spotify:track:0eGsygTp906u18L0Oimnem]
     * @param  {[Func]} _tube_    [Youtube Channel]
     * @return {[Object]}           [Track_info record]
     */
    function _fetchWithID(_ricky_, _trackID_) {

        var deferred = Q.defer();

        console.log(self.name, "is retrieving info for", _trackID_);

        Ethel.getSpotifyApi().getTrack(_trackID_).then(
            function(_track_) {
                //our job is to fill this record out and keep it up to date as best as we can
                var track_record = _fetchPristineTrackRecord();
                var _song_ = _constructSong(_track_.body);

                //searching info accross channels, easily add more channels
                //[youtube, soundcloud, lastfm] ORDER IMPORTANT
                var searchResults = [_fetchYoutube(_ricky_, _song_)];

                //only accept result when all channels give back result
                //this is sorta bad, but we only use youtube and spotify now so its ok
                //but when we use more than 3 channels, add some lazy track_info retrieval system yo

                Q.all(searchResults).then(function(data) {
                        track_record.song = _song_;
                        track_record.spotify = _track_.body;

                        if(typeof data[0] !== 'object' || !data[0].hasOwnProperty("score")){

                          return deferred.reject(new Error(_ricky_.name + " said sr cuz he couldnt find any youtube info for this track >.<"));
                        }
                        track_record.youtube = data[0];
                        deferred.resolve(track_record);
                    },
                    function(err) {
                        deferred.reject(new Error(err));

                    });

            }, function(err) {

                deferred.reject(new Error("The puppy got lost yo"));
            }).done();

        return deferred.promise;
    }

    function _is_first_record_score_better_than_2nd_one(newScore, oldScore, strictly) {

        if (strictly) {
            return newScore.score > oldScore.score && newScore.percent > oldScore.percent;
        }
        return newScore.score >= oldScore.score && newScore.percent >= oldScore.percent;
    }

    function _constructSong(_track_) {

        var artist = [];
        _track_.artists.forEach(function(elm, index, arr) {
            artist.push(elm.name);
        });
        artist = artist.join(", ");
        //serve as metadata
        var song = {
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
        return song;
    }

    /**
     * given a string sniff out if is a spotify url or uri -> get id
     * or return if id already
     * or null if not id
     * @param  {[string]} _trackID_ [the candidate id]
     * @return {[type]}           [description]
     */
    function _sniff(_trackID_) {

        var token1 = _trackID_.split(":"),
            token2 = _trackID_.split("/");
        var isTrackURI = (token1.length === 3) && ((token1[0]).toLowerCase() === "spotify") && ((token1[1]).toLowerCase() === "track");
        var isTrackURL = (token2.length >= 2) && ((token2[token2.length - 2]).toLowerCase() === "track");

        var isID = (_trackID_.split("\\s+").length === 1) && (_trackID_.split("").length > 20) && /^[a-z0-9]+$/i.test(_trackID_);
        //console.log(isTrackURI, isTrackURL, isID);

        if (isTrackURI) {
            return token1[2];
        } else if (isTrackURL) {
            return token2[token2.length - 1];
        } else if (isID) {
            return _trackID_;
        }

        return null;
    }

    function _fetchYoutube(_ricky_, _song_) {

        return _ricky_.search_your_tube(_song_);
    }

    function _fetchPristineTrackRecord() {

        return {
            song: null, //quick meta data cache
            fileName: null, //filename songname-artist (illigal character removed)
            paths: { // self explanatory 
                yt_vid: null,
                yt_aud: null
            },
            spotify: null,
            youtube: null,
            soundcloud: null,
            lastfm: null
        };
    }

}

module.exports = golden_retriever;