/*
 * GET home page.
 */
var path = require('path'),
    querystring = require('querystring'),
    request = require('request'),
    fs = require('fs-extra');
var SpotifyWebApi = require('spotify-web-api-node');
var jsonfile = require('jsonfile');
var Q = require('q');


function Ethel() {

    var self = this;

    self.credentials = require("./config/credentials.json").spotifyWebApi;
    self.scopes = require("./config/credentials.json").spotify_scopes;
}

Ethel.prototype.getMe = function() {

    var deferred = Q.defer();
    var self = this;

    jsonfile.readFile("./config/user.json", function(err, obj) {

        if (err) {
            deferred.reject(new Error(err));
        } else {

            deferred.resolve(obj);
        }
    });
    return deferred.promise;
};

Ethel.prototype.getSpotifyApi = function() {

    var self = this;

    return new SpotifyWebApi(self.credentials);
};

Ethel.prototype.getSpotifyApi_WTokens = function() {

    var self = this;

    return self.setAccessTokens(self.getSpotifyApi());
};

Ethel.prototype.setAccessTokens = function(spotifyApi) {

    var deferred = Q.defer();

    jsonfile.readFile("./config/user.json", function(err, obj) {

        if (err) {
            deferred.reject(new Error(err));
        } else {

            spotifyApi.setAccessToken(obj['access_token']);
            spotifyApi.setRefreshToken(obj['refresh_token']);
            deferred.resolve(spotifyApi);
        }
    });
    return deferred.promise;
};

 Ethel.prototype.setUser = function(user) {

    var deferred = Q.defer();

    var self = this;
    var spotifyApi = self.getSpotifyApi();

    var expireDate = new Date();
    expireDate.setSeconds(expireDate.getSeconds() + (parseInt(user['expires_in'], 10) - 720));

    var access_token = user['access_token'] || spotifyApi.getAccessToken();
    var refresh_token = user['refresh_token'] || spotifyApi.getRefreshToken();
    var newUser = {
        expires_at: expireDate.toString(),
        access_token: access_token,
        refresh_token: refresh_token,
        info: null,
    };

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Get the authenticated user
    spotifyApi.getMe()
        .then(function(data) {
            // console.log('Some information about the authenticated user', data.body);
            newUser.info = data.body;
            deferred.resolve(newUser);

        }, function(err) {
            console.log('Something went wrong!', err);
            deferred.reject(new Error(err));
        }).done();

    return deferred.promise;
};

Ethel.prototype.getUser = function(code) {

    var deferred = Q.defer();

    if (typeof code !== 'string') {
        return Q.reject(new Error("No Code, Can't getUser"));
    }

    var self = this;
    var spotifyApi = self.getSpotifyApi();
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            // console.log('The token expires in ' + data.body['expires_in']);
            // console.log('The access token is ' + data.body['access_token']);
            // console.log('The refresh token is ' + data.body['refresh_token']);
            deferred.resolve(self.setUser(data.body));

        }, function(err) {
            console.log('Something went wrong!', err);
            deferred.reject(new Error(err));
        });

    return deferred.promise;

};

//lol
Ethel.prototype.entertainUser = function() {
    // requesting access token from refresh token

    var deferred = Q.defer();
    var self = this;
    // clientId, clientSecret and refreshToken has been set on the api object previous to this call.
    self.getSpotifyApi_WTokens().then(

        function(spotifyApi) {

            spotifyApi.refreshAccessToken().then(

                function(data) {

                    data.body.refresh_token = spotifyApi.getRefreshToken();
                    deferred.resolve(self.setUser(data.body));
                },
                function(err) {
                    deferred.reject(new Error(err));
                });
        },
        function(err) {

            deferred.reject(new Error(err));
        }).done();

    return deferred.promise;

};


var _getPlaylists = function(spotifyApi, userID) {

    if (!spotifyApi.getAccessToken()) {

        return Q.reject(new Error("Requires spotifyApi with Access Token"));
    }

    var deferred = Q.defer();

    var result = [];
    var total = 0;
    var offset = 0;
    var limit = 0;

    var promises = [];

    spotifyApi.getUserPlaylists(userID)
        .then(function(data) {

            total = data.body.total;
            limit = data.body.items.length;
            offset = data.body.items.length;
            result = result.concat(data.body.items);

            while (offset < total) {

                promises.push(spotifyApi.getUserPlaylists(userID, {
                    offset: offset,
                    limit: limit
                }));
                offset += limit;
            }

            Q.all(promises).then(function(data) {
                    for (var x = 0; x < data.length; x++) {
                        result = result.concat(data[x].body.items);
                    }
                    deferred.resolve(result);
                },
                function(err) {
                    deferred.reject(new Error(err));

                });
        }, function(err) {
            deferred.reject(new Error(err));
        });

    return deferred.promise;
};

Ethel.prototype.getPlaylists = function(userID) {
    console.log("getting playlists for", userID);
    var deferred = Q.defer();
    var self = this;

    self.getSpotifyApi_WTokens()
        .then(function(spotifyApiWithTokens) {

            deferred.resolve(_getPlaylists(spotifyApiWithTokens, userID));
        }, function(reason) {

            deferred.reject(new Error(reason));
        });

    return deferred.promise;
};

module.exports = Ethel;


// exports.getPlaylistTracks = function(id, playlistID, callback) {
//     var result = [];
//     var total = 0;
//     var offset = 0;
//     var limit = 0;

//     var promises = [];

//     spotifyApi.getPlaylistTracks(id, playlistID)
//         .then(function(data) {

//             total = data.body.total;
//             limit = data.body.items.length;
//             offset = data.body.items.length;
//             result = result.concat(data.body.items);

//             while (offset < total) {

//                 promises.push(_helper(offset, limit));
//                 offset += limit;
//             }
//             Q.all(promises).then(function(data) {
//                     for (var x = 0; x < data.length; x++) {
//                         result = result.concat(data[x].body.items);
//                     }
//                     callback(null, result);
//                 },
//                 function(err) {
//                     callback(err);

//                 });
//         }, function(err) {
//             callback(err);
//         });

//     function _helper(offset, limit) {

//         return spotifyApi.getPlaylistTracks(id, playlistID, {
//             offset: offset,
//             limit: limit
//         });
//     }

// };