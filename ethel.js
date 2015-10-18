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

var scopes = ['playlist-read-private', 'playlist-read-collaborative', 'user-library-read', 'user-read-email', 'user-follow-read'];

var credentials = {
    clientId: '35980535d5e94180a3244e5c4f5eb583',
    clientSecret: 'cb562cf480ee495597081aaea4455019',
    redirectUri: 'http://localhost:8888/authCallback'
};

var spotifyApi = new SpotifyWebApi(credentials);


jsonfile.readFile("./config/user.json", function(err, obj) {

    if (!err) {
        spotifyApi.setAccessToken(obj['access_token']);
        spotifyApi.setRefreshToken(obj['refresh_token']);
    }
});


exports.getPlaylists = function(id, callback) {
    var result = [];
    var total = 0;
    var offset = 0;
    var limit = 0;

    var promises = [];

    spotifyApi.getUserPlaylists(id)
        .then(function(data) {

            total = data.body.total;
            limit = data.body.items.length;
            offset = data.body.items.length;
            result = result.concat(data.body.items);

            while (offset < total) {

                promises.push(_helper(offset, limit));
                offset += limit;
            }
            Q.all(promises).then(function(data) {
                    for (var x = 0; x < data.length; x++) {
                        result = result.concat(data[x].body.items);
                    }
                    callback(null, result);
                },
                function(err) {
                    callback(err);

                });
        }, function(err) {
            callback(err);
        });

    function _helper(offset, limit) {

        return spotifyApi.getUserPlaylists(id, {
            offset: offset,
            limit: limit
        });
    }

};
exports.getPlaylistTracks = function(id, playlistID, callback) {
    var result = [];
    var total = 0;
    var offset = 0;
    var limit = 0;

    var promises = [];

    spotifyApi.getPlaylistTracks(id, playlistID)
        .then(function(data) {

            total = data.body.total;
            limit = data.body.items.length;
            offset = data.body.items.length;
            result = result.concat(data.body.items);

            while (offset < total) {

                promises.push(_helper(offset, limit));
                offset += limit;
            }
            Q.all(promises).then(function(data) {
                    for (var x = 0; x < data.length; x++) {
                        result = result.concat(data[x].body.items);
                    }
                    callback(null, result);
                },
                function(err) {
                    callback(err);

                });
        }, function(err) {
            callback(err);
        });

    function _helper(offset, limit) {

        return spotifyApi.getPlaylistTracks(id, playlistID,{
            offset: offset,
            limit: limit
        });
    }

};

exports.getMe = function(callback) {
    spotifyApi.getMe()
        .then(function(data) {
            callback(null, data.body);
        }, function(err) {
            callback(err);
        });
};

exports.index = function(req, res) {
    spotifyApi.getMe()
        .then(function(data) {
            res.send("Hi, I'm Lucy <br> <br>" + JSON.stringify(data.body));

        }, function(err) {
            res.send("Hi, I'm Lucy <br> <br> <a href=login>Login</a>");

        });
};

exports.login = function(req, res) {

    var authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    // your application requests authorization
    res.redirect(authorizeURL);
};

exports.get_token = function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;

    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            var user = {
                expire: data.body['expires_in'],
                access_token: data.body['access_token'],
                refresh_token: data.body['refresh_token'],
                info: null,
            };
            // Get the authenticated user
            spotifyApi.getMe()
                .then(function(data) {
                    console.log('Some information about the authenticated user', data.body);
                    user.info = data.body;
                    jsonfile.writeFile("./config/user.json", user, {
                        spaces: 2
                    }, function(err) {
                        if (err) console.log(err);
                        res.redirect("/index");
                    });
                }, function(err) {
                    console.log('Something went wrong!', err);
                    res.redirect("/index");
                });

        }, function(err) {
            console.log('Something went wrong!', err);
            res.redirect("/index");
        });
};

exports.refresh_token = function(req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(spotifyConfig.client_id + ':' + spotifyConfig.client_secret).toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
};