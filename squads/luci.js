"use strict";

var fs = require('fs-extra');
var path = require('path');
var util = require('util');
var jsonfile = require('jsonfile');
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var Youtube = require("youtube-api"),
    Logger = require("bug-killer"),
    Opn = require("opn");
var Q = require('q');
var existsSync = require('exists-sync');

var Ricky = require('./ricky.js');
var Fred = require('./fred.js');
var Ethel = require('./ethel.js');

var cwd = process.cwd();

var Lucy = (function() {

    var quotes = null;
    var name = "Lucy";

    var vault = null;
    var vaultAdd = "";
    var vaultKeeper = null;

    var credentials = null;
    var yt_oauth = null;

    var ethel = null;

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
        var spirit_mana = null;

        function summon(user) {

            var deferred = Q.defer();

            jsonfile.writeFile(cwd + "/config/user.json", user, {
                spaces: 2
            }, function(err) {
                if (err) {
                    deferred.reject(new Error(err));
                } else {

                    spirit = user;

                    clearTimeout(spirit_mana);

                    var back2back = (new Date(user.expires_at) - new Date());
                    console.log("Spirit is flying away in", back2back / 1000, " seconds");

                    spirit_mana = charged_up(back2back);

                    deferred.resolve(spirit);

                }
            });
            return deferred.promise;
        }

        function charged_up(energy) {

            return setTimeout(function() {
                //either convince soul to stay or let it go let it go
                ethel.entertainUser().then(

                    function(_entertainedUser) {

                        console.log(_entertainedUser);
                        summon(_entertainedUser);
                    },
                    function(reason) {
                        console.log(reason);
                        lost();
                    }).done();
                return; //lost();
            }, energy);
        }

        function heal() {

            return spirit;
        }

        function lost() {

            spirit = null;
            clearTimeout(spirit_mana);
            fs.remove(cwd + "/config/user.json", function(err) {

                if (err) return console.error(err);
                syncing = false; // to be removed
                console.log("Soul is lost");
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
                return check_vault(track_id).then(function(newSong) {
                    console.log(newSong.song.title, "-", newSong.song.artist, "(", newSong.song.id, ") is in", path.normalize(vaultAdd));
                    //console.log(JSON.stringify(newSong, null, 2));
                }, function(err) {
                    console.log('Fail to find anything about', track_id);
                    console.log(err);
                }).done();
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
            //talk_or_listen();
            clearTimeout(pulse);
            if (!alive) return;

            pulse = setTimeout(function() {
                dirty = false;
                var my = soul.heal();
                if (awake && !syncing && my !== null && typeof my !== 'undefined') {
                    my = my.info;
                    syncing = true;
                    console.log("Hi There", my.display_name);

                    ethel.getPlaylists(my.id).then(
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

        if (!existsSync(cwd + "/config")) {

            console.log("/config pls");
            throw new Error("set /config pls");
        }
        quotes = jsonfile.readFileSync(cwd + "/config/quotes.json");
        vault = jsonfile.readFileSync(cwd + "/config/vaults.json").main_vault;
        vaultAdd = path.normalize(vault.location + "/" + vault.name);

        vaultKeeper = new Fred(vault.location, vault.name, "Fred");
        ethel = new Ethel("Ethel");

        credentials = jsonfile.readFileSync(cwd + "/config/credentials.json");

        yt_oauth = Youtube.authenticate({
            type: "key",
            key: credentials["yt_api_keys"]["lucy_alpha"]
        });


        live();
        heart.beat();

        ethel.getMe()
            .then(function(User) {
                wakeup(User);
            }, function(err) {
                //console.log(err);
                sleep();
            }).done();
    }

    function talk_or_listen(pls) {

        if (typeof quotes !== 'object') return;

        var isThereAnyOneSpeaking = Math.random() < 0.5;
        if (pls || isThereAnyOneSpeaking) {

            var people = Object.keys(quotes);
            var whoSay = people[Math.floor(Math.random() * people.length)];
            var whatQuotes = quotes[whoSay];

            return (whoSay + ":" + whatQuotes[Math.floor(Math.random() * whatQuotes.length)]);
        }
        return;
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

    function check_vault(trackID) {
        //trackID must is spotify ID for now, i know limitation, chillout i got this  later
        return vaultKeeper.check_vault(Youtube, trackID);
    }

    return {
        name: name,
        sleep: sleep,
        wakeup: wakeup,
        areYouUp: areYouUp,
        comeAlive: i_love_lucy,
        talk_or_listen: talk_or_listen,
        //to be removed
        where_is_your_vault: function() {
            return vaultAdd;
        },
        do_you_have_this_track: check_vault
    };
})();

module.exports = Lucy;




