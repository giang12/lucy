var fs = require('fs');
var util = require('util');
var jsonfile = require('jsonfile');
var express = require('express');
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var Youtube = require("youtube-api"),
    Logger = require("bug-killer"),
    Opn = require("opn");

var Ricky = require('./ricky.js');
var Fred = require('./fred.js');
var Ethel = require('./ethel.js');




var VAULT = "";

var CREDENTIALS = null;

var state = {
    track_id: null,
    volume: null,
    position: null,
    state: null
};

var yt_oauth = null;


var tracking = {
    track_id: [],
    state: [],
    volume: [],
    position: []
};


/*
Check Config folder
Init vault folder
Set Credentials
Youtube authenticate
 */
(function i_love_lucy() {

    if (!fs.existsSync("./config")) {

        console.log("set ./config pls");
        throw new Error("set ./config pls");
    }

    VAULT = jsonfile.readFileSync("./config/paths.json").vault_location;

    CREDENTIALS = jsonfile.readFileSync("./config/credentials.json");

    yt_oauth = Youtube.authenticate({
        type: "key",
        key: CREDENTIALS["yt_api_keys"]["lucy_alpha"]
    });

    var folders = [VAULT + "/vault", VAULT + "/vault/track_info", VAULT + "/vault/track_audio", VAULT + "/vault/track_video"];

    folders.forEach(function(dir, index) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log("Creating", dir);
        }
    });

})();

/** Bind Lucy */
//if current playing song changed
tracking['track_id'].push(
    //check vault, add/update best matched songs to vault
    function(track_id) {
        return Fred.checkVault(Youtube, track_id, VAULT).done();
    }
);

/** And Lucy's Heart Starts Beating : Come  alive*/
var syncing = false;

function sync(user, playlists) {

    var total_playlist = playlists.length;
    var failure = [];
    var success = 0;
    console.log("playlists.length:", total_playlist);

    playlists.forEach(function(elm, key) {
        console.log((key+1)+"("+total_playlist+"):", elm.name);
    });

    //next step spawn child to sycn playlist songs

}

(function heartbeat() {
    var pulse;
    clearTimeout(pulse);
    pulse = setTimeout(function() {

        var dirty = false;

        Ethel.getMe(function(err, me) {
            if (!err && !syncing) {
                syncing = true;
                Ethel.getPlaylists(me.id, function(err, data) {
                    if (err) {
                        syncing = false;
                        return;
                    }
                    sync(me, data);
                });
            }
        });

        spotify_daemon.getState(function(_error_, _state_) {

            if (_error_) return heartbeat();
            Object.keys(tracking).forEach(function(key) {

                if (_state_[key] != state[key] && tracking[key].length !== 0) {

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

var app = express();
var port = process.env.PORT || 8888;

/**
 * Routes
 */
/** Authentication / Token */
app.get('/login', Ethel.login);
app.get('/authCallback', Ethel.get_token);
app.get('/refresh_token', Ethel.refresh_token);

// redirect all others to the index (HTML5 history)
app.get('*', Ethel.index);

app.listen(port);
console.log('Express app started on port ' + port);