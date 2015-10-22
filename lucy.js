var fs = require('fs');
var util = require('util');
var jsonfile = require('jsonfile');
var express = require('express');
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var Youtube = require("youtube-api"),
    Logger = require("bug-killer"),
    Opn = require("opn");
var Q = require('q');

var Ricky = require('./ricky.js');
var Fred = require('./fred.js');
var Ethel = new(require('./ethel.js'))();


var Lucy = (function() {

    var vault = null;
    var vaultAdd = "";
    var vaultKeeper = null;

    var credentials = null;
    var yt_oauth = null;

    var state = {
        track_id: null,
        volume: null,
        position: null,
        state: null
    };
    var tracking = {
        user_id: [],
        track_id: [],
        state: [],
        volume: [],
        position: []
    };
    
    var syncing = false;

    var alive = false;
    var awake = false;
    var dirty = false;

    var soul = (function soul() {
        var spirit = null;

        function summon(user) {

            var deferred = Q.defer();

            jsonfile.writeFile("./config/user.json", user, {
                spaces: 2
            }, function(err) {
                if (err) {
                    deferred.reject(new Error(err));
                } else {
                    spirit = user;
                    deferred.resolve(spirit);
                }

            });
            return deferred.promise;
        }

        function heal() {

            return spirit;
        }

        function lost() {

            spirit = null;
            fs.unlink("./config/user.json",function(err, value){
                if(!err) console.log("Soul is lost");
            });
            return spirit;
        }

        return {
            summon: summon,
            heal: heal,
            lost: lost
        };
    })();

    var memory = (function memory() {
        /** Bind Lucy */
        //if current playing song changed
        tracking['track_id'].push(
            //check vault, add/update best matched songs to vault
            function(track_id) {
                return vaultKeeper.checkVault(Youtube, track_id).done();
            }
        );

        function setMemory() {
            //
        }

        return {

            setMemory: setMemory
        };
    })();

    var heart = (function heart() {
        var pulse;

        function beat() {
            console.log("heart beating");
            clearTimeout(pulse);
            if (!alive) return;

            pulse = setTimeout(function() {
                dirty = false;
                var my = soul.heal();
                if (awake && !syncing && my !== null && typeof my !== 'undefined') {
                    my = my.info;
                    syncing = true;
                    console.log("Hi There", my.display_name);

                    Ethel.getPlaylists(my.id).then(
                        function(playlists) {

                            sync(my, playlists);
                        },
                        function(err) {
                            console.log(err);
                            syncing = false;
                        });
                }

                spotify_daemon.getState(function(_error_, _state_) {

                    if (_error_) return beat();
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
                    return beat();
                });
            }, 2000);
        }

        function stop() {
            clearTimeout(pulse);
            console.log("stop it");
        }

        return {
            beat: beat,
            stop: stop
        };
    })();
    /*
    Check Config folder
    Init vault folder
    Set Credentials
    Youtube authenticate
    come live
    heart beat
    set awake if awake
     */
    function i_love_lucy() { //aka lucy init

        if (alive) return;

        if (!fs.existsSync("./config")) {

            console.log("set ./config pls");
            throw new Error("set ./config pls");
        }

        vault = jsonfile.readFileSync("./config/vaults.json").main_vault;
        vaultAdd = vault.location + "/" + vault.name;
        vaultKeeper = new Fred(vault.location, vault.name);
        credentials = jsonfile.readFileSync("./config/credentials.json");

        yt_oauth = Youtube.authenticate({
            type: "key",
            key: credentials["yt_api_keys"]["lucy_alpha"]
        });

        var folders = ["./vaults", vaultAdd, vaultAdd + "/track_info", vaultAdd + "/track_audio", vaultAdd + "/track_video"];

        folders.forEach(function(dir, index) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
                console.log("Creating", dir);
            }
        });
        live();
        heart.beat();
        Ethel.getMe()
            .then(function(User) {
                wakeup(User);
            }, function(err) {
                //console.log(err);
                sleep();
            }).done();
    }

    function live() {

        alive = true;
    }

    function die() {

        alive = false;
        sleep();
        heart.stop();
    }

    function sleep() {

        soul.lost();
        awake = false;
    }

    function wakeup(User) {

        soul.summon(User);
        awake = true;
    }

    function areYouUp() {

        return awake;
    }

    function areYouGud() {

        return alive;
    }

    function sync(user, playlists) {

        var total_playlist = playlists.length;
        var failure = [];
        var success = 0;
        console.log("playlists.length:", total_playlist);

        // playlists.forEach(function(elm, key) {
        //     console.log((key + 1) + "(" + total_playlist + "):", elm.name);
        // });

        //next step spawn child to sycn playlist songs

    }

    return {
        sleep: sleep,
        wakeup: wakeup,
        areYouUp: areYouUp,
        comeAlive: i_love_lucy
    };
})();


/** And Lucy's Heart Starts Beating : Come  alive*/
Lucy.comeAlive();


var app = express();
var port = process.env.PORT || 8888;

/**
 * Routes
 */
/** Authentication / Token */
app.get('/login', function(req, res) {

    var authorizeURL = Ethel.getSpotifyApi().createAuthorizeURL(Ethel.scopes);
    // your application requests authorization
    res.redirect(authorizeURL);
});
app.get('/logout', function(req, res) {

    Lucy.sleep();
    res.redirect("/index");
});
app.get('/authCallback', function(req, res) {
    var code = req.query.code || null;

    Ethel.getUser(code).then(
        function(user) {
            //console.log(user);
            Lucy.wakeup(user);
            res.redirect("/index");
        },
        function(err) {
            Lucy.sleep();
            res.redirect("/index");
        }).done();

});
// app.get('/refresh_token', Ethel.refresh_token);

// // redirect all others to the index (HTML5 history)
app.get('*', function(req, res) {

    Ethel.getMe()
        .then(function(User) {
            res.send("Hi "+User.info.display_name+", <br> <a href=logout>Logout</a> <br>" + JSON.stringify(User.info));

        }, function(err) {
            res.send("Hi, I'm Lucy <br> <br> <a href=login>Login</a>");

        }).done();
});

app.listen(port);
console.log('Express app started on port ' + port);