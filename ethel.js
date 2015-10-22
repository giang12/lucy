/*
 * GET home page.
 */
var path = require('path'),
    querystring = require('querystring'),
    request = require('request'),
    fs = require('fs');
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
            deferred.reject(err);
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
            deferred.reject(err);
        } else {
            
            spotifyApi.setAccessToken(obj['access_token']);
            spotifyApi.setRefreshToken(obj['refresh_token']);
            deferred.resolve(spotifyApi);
        }
    });
    return deferred.promise;
};

Ethel.prototype.getUser = function(code) {

    var deferred = Q.defer();

    if (typeof code !== 'string') {
        return Q.Promise((new Error("No Code, Can't getUser")));
    }

    var self = this;
    var spotifyApi = self.getSpotifyApi();
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {

            // console.log('The token expires in ' + data.body['expires_in']);
            // console.log('The access token is ' + data.body['access_token']);
            // console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            var expireDate = new Date();
            expireDate.setSeconds(expireDate.getSeconds() + (parseInt(data.body['expires_in'], 10) - 300));

            var user = {
                expire: expireDate.toString(),
                access_token: data.body['access_token'],
                refresh_token: data.body['refresh_token'],
                info: null,
            };
            // Get the authenticated user
            spotifyApi.getMe()
                .then(function(data) {
                    // console.log('Some information about the authenticated user', data.body);
                    user.info = data.body;
                    deferred.resolve(user);

                }, function(err) {
                    console.log('Something went wrong!', err);
                    deferred.reject(new Error(err));
                });

        }, function(err) {
            console.log('Something went wrong!', err);
            deferred.reject(new Error(err));
        });

    return deferred.promise;

};



var _getPlaylists = function(spotifyApi, userID) {

    if (!spotifyApi.getAccessToken()) {
        Q.Promise(new Error("Requires spotifyApi with Access Token"));
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
                    deferred.reject(err);

                });
        }, function(err) {
            deferred.reject(err);
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

            deferred.reject(reason);
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




// exports.refresh_token = function(req, res) {
//     // requesting access token from refresh token
//     var refresh_token = req.query.refresh_token;
//     var authOptions = {
//         url: 'https://accounts.spotify.com/api/token',
//         headers: {
//             'Authorization': 'Basic ' + (new Buffer(spotifyConfig.client_id + ':' + spotifyConfig.client_secret).toString('base64'))
//         },
//         form: {
//             grant_type: 'refresh_token',
//             refresh_token: refresh_token
//         },
//         json: true
//     };

//     request.post(authOptions, function(error, response, body) {
//         if (!error && response.statusCode === 200) {
//             var access_token = body.access_token;
//             res.send({
//                 'access_token': access_token
//             });
//         }
//     });
// };