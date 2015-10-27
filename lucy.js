var fs = require('fs-extra');
var path = require('path');
var url = require("url");
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

    var quotes = null;
    var name = "Lucy";

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
        var spirit_mana = null;

        function summon(user) {

            var deferred = Q.defer();

            jsonfile.writeFile("./config/user.json", user, {
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
                Ethel.entertainUser().then(

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
            fs.remove("./config/user.json", function(err) {

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
                return vaultKeeper.checkVault(Youtube, track_id).then(function(newSong) {
                    console.log(newSong.song.name, "-", newSong.song.album_artist, "(", track_id, ") is in", vaultAdd);
                    console.log(JSON.stringify(newSong, null, 2));
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
        quotes = jsonfile.readFileSync("./config/quotes.json");
        vault = jsonfile.readFileSync("./config/vaults.json").main_vault;
        vaultAdd = vault.location + "/" + vault.name;
        vaultKeeper = new Fred(vault.location, vault.name);

        credentials = jsonfile.readFileSync("./config/credentials.json");

        yt_oauth = Youtube.authenticate({
            type: "key",
            key: credentials["yt_api_keys"]["lucy_alpha"]
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

    return {
        sleep: sleep,
        wakeup: wakeup,
        areYouUp: areYouUp,
        comeAlive: i_love_lucy,
        talk_or_listen: talk_or_listen,
        //to be removed
        where_is_your_vault: function() {
            return vaultAdd;
        }
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
            //Lucy.sleep();
            res.redirect("/index");
        }).done();

});
// app.get('/refresh_token', Ethel.refresh_token);
app.get('/vault/:vaultAdd/:orderBy?', function(req, res) {

    var vault = path.resolve(req.params.vaultAdd);
    var orderBy = req.params.orderBy || "a";
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true)+"<br>");
    ret.push("<br><a onclick='window.history.href='/index';return false;' href=/index>⬅Back Index</a> | <A HREF='javascript:history.go(0)'>&#8634 Click to refresh the page</A><br>");
    ret.push("Vault is set to " + path.resolve(req.params.vaultAdd));

    fs.readdir(track_info, function(err, tracks) {
        if (err) {
            ret.push("<br>" + new Error(err) + "<br>");
            return res.send(ret.join(""));
        }
        total = tracks.length;
        var trackList = [];
        trackList.push('<ol id="track-list" type="1">');
        if (orderBy === "l" || orderBy === "c") {
            tracks = tracks.map(function(v) {
                return {
                    name: v,
                    time: fs.statSync(track_info + "/" + v).mtime.getTime()
                };
            })
                .sort(function(a, b) {
                    return (orderBy === "l" ? (b.time - a.time) : (a.time - b.time));
                })
                .map(function(v) {
                    return v.name;
                });
        }
        tracks.forEach(function(elm, index, arr) {
            if (!/^\..*/.test(elm)) {
                var params = encodeURIComponent(req.params.vaultAdd) + "/" + encodeURIComponent(elm);
                trackList.push("<li><a onclick='window.location.href='/track/" + params + "';return false;' href=/track/" + params + ">➥" + elm + " </a></li><br>");
            } else {
                total--;
            }
        });
        trackList.push("</ol>");
        var aTag = "onclick='window.location.href='/vault/" + encodeURIComponent(req.params.vaultAdd) + "';return false;' href=/vault/" + encodeURIComponent(req.params.vaultAdd);
        var aCommand = orderBy ==='a'? "class=active>➥" : (aTag+"/a>");
        var Lcommand = orderBy ==='l'? "class=active>➥" : (aTag+"/l>");
        var Ccommand = orderBy ==='c'? "class=active>➥" : (aTag+"/c>");

        ret.push("<br>There are tracks <b>" + total + "</b> in vault orderBy <a "+aCommand+"Alphabet</a> | <a "+Lcommand+"Lastest</a> | <a "+Ccommand+"Chronological</a>");
        ret = ret.concat(trackList);
        ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "addStyleString('#track-list{ height:80%; width:90%; overflow-y:auto; overflow-x:hidden}');"+
            "</script>"
        );
        return res.send(ret.join(""));
    });

});
app.get('/playback/:trackAdd', function(req, res) {

    var trackAdd = req.params.trackAdd;
    var file = path.resolve(__dirname, trackAdd);
    var token = trackAdd.split(".");
    var ext = token[token.length - 1];
    var range = req.headers.range;
    var isVid = ext === "mp4";
    if (!fs.existsSync(file) || (ext !== "mp4" && ext !== "mp3")) {
        res.writeHead(404, {
            "Content-Type": "text/html"
        });
        res.end("<br><a onclick='window.location.href='/index';return false;' href=/index><=Back Index</a><br><br>Cannot playback " + (isVid ? "video" : "audio"));
    } else if (typeof range === 'undefined') {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        if (isVid) {
            res.end('<video autoplay style="width:100%;height:90%" src="/playback/' + encodeURIComponent(trackAdd) + '" controls></video>');
        } else {
            res.end('<audio autoplay style="width:100%;height:50%" src="/playback/' + encodeURIComponent(trackAdd) + '" controls></audio>');
        }
    } else {
        var positions = range.replace(/bytes=/, "").split("-");
        var start = parseInt(positions[0], 10);

        fs.stat(file, function(err, stats) {

            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            var chunksize = (end - start) + 1;

            res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": isVid ? "video/mp4" : "audio/mp3"
            });

            var stream = fs.createReadStream(file, {
                    start: start,
                    end: end
                })
                .on("open", function() {
                    stream.pipe(res);
                }).on("error", function(err) {
                    res.end(new Error(err) + "");
                });
        });
    }
});

app.get('/track/:vaultAdd/:trackName', function(req, res) {
    var vault = path.resolve(req.params.vaultAdd);
    var track = req.params.trackName;
    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret =['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    
    ret.push(Lucy.talk_or_listen(true) + "<br>");
    ret.push("<br><a onclick='window.history.back();return false;' href=vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + ">⬅Back " + path.resolve(Lucy.where_is_your_vault()) + " </a><br>");
    ret.push("<br><b>" + track + "</b>");
    jsonfile.readFile(track_info + "/" + track, function(err, info) {
        if (err) {
            ret.push("<br>" + new Error(err) + "<br>");
            return res.send(ret.join(""));
        }
        ret.push('<br><center><video controls width=90% autoplay><source src="/playback/' + encodeURIComponent(info.paths.yt_vid) + '" type="video/mp4">Your browser does not support HTML5 video.</video></center>');
        ret.push('<br><center>Audio Only: <audio controls><source src="/playback/' + encodeURIComponent(info.paths.yt_aud) + '" type="audio/mp3">Your browser does not support HTML5 audio.</audio></center>');
        ret.push("<pre>Track Info:<br> " + JSON.stringify(info, null, 2) + "</pre>");
            
        ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "</script>"
        );

        ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "addStyleString('#vid{margin:0; padding:0;height=55%; width=90% overflow:auto; background-color:blue}');" +
            "</script>"
        );
        return res.send(ret.join(""));
    });

});
// // redirect all others to the index (HTML5 history)
app.get('/index', function(req, res) {
    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    Ethel.getMe()
        .then(function(User) {
            ret.push(Lucy.talk_or_listen(true) + "<br>");
            ret.push("<br>Vault Address @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + path.resolve(Lucy.where_is_your_vault()) + " </a>");
            ret.push("<br>Hey there " + User.info.display_name + ", you need to go in " + formatTime((new Date(User.expires_at) - new Date())) + " @ " + formatDate(User.expires_at));
            ret.push("<br><br><a href=logout>Logout</a> <i>*note that if you accessing from other devices, dont logout, cuz you can't log back in cuz spotify callback is set to localhost for now son");
            ret.push("<pre>Access_Token:<br> " + User.access_token);
            ret.push("<br><br>Refresh_Token:<br> " + User.refresh_token);
            ret.push("<br><br>User_Info:<br> " + JSON.stringify(User.info, null, 2) + "</pre>");
            ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "</script>"
            );

            res.send(ret.join(""));

        }, function(err) {
            res.send("Hi, I'm Lucy <br> <br> <a href=login>Login</a>");
            ret.push("<br>Vault Address @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + ">➥" + path.resolve(Lucy.where_is_your_vault()) + " </a><br>");

        }).done();
});

app.get('*', function(req, res) {

    res.redirect("/index");

});

app.listen(port);
console.log('Express app started on port ' + port);

function formatDate(date) {
    var d = new Date(date);
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12) {
        h = hh - 12;
        dd = "PM";
    }
    if (h === 0) {
        h = 12;
    }
    m = m < 10 ? "0" + m : m;

    s = s < 10 ? "0" + s : s;

    /* if you want 2 digit hours:
    h = h<10?"0"+h:h; */

    var pattern = new RegExp("0?" + hh + ":" + m + ":" + s);

    var replacement = h + ":" + m;
    /* if you want to add seconds
    replacement += ":"+s;  */
    replacement += " " + dd;

    return date.replace(pattern, replacement);
}
var ms2s = 1000,
    s2m = ms2s * 60,
    m2h = s2m * 60,
    h2d = m2h * 24;

function timeDiff(time1, time2, op) {

    if (typeof time1 === "object")
        time1 = time1.getTime();
    if (typeof time2 === "object")
        time2 = time2.getTime();
    if (typeof time1 !== "number" || typeof time2 !== "number")
        throw new Error("Unexpected Argument");

    if (time1 < time2)
        return formatTime(time2 - time1, op);

    return formatTime(time1 - time2, op);
}

function formatTime(ms, op) {

    if (typeof ms !== "number")
        throw new Error("Unexpected Argument");

    milliseconds = ms % 1000 || 0;
    seconds = Math.floor(ms / ms2s) % 60 || 0;
    minutes = Math.floor(ms / s2m) % 60 || 0;
    hours = Math.floor(ms / m2h) % 24 || 0;
    days = Math.floor(ms / h2d) || 0;
    stringFormatted = (days !== 0 ? days + (days > 1 ? " days " : " day ") : "") +
        (hours !== 0 ? hours + (hours > 1 ? " hours " : " hour ") : "") +
        (minutes !== 0 ? minutes + (minutes > 1 ? " minutes " : " minute ") : "") +
        (seconds !== 0 ? seconds + (seconds > 1 ? " seconds " : " second ") : "");
    switch (op) {

        case "s":
        case "second":
        case "seconds":
            return ms / ms2s;

        case "m":
        case "min":
        case "mins":
        case "minute":
        case "minutes":
            return ms / s2m;

        case "h":
        case "hour":
        case "hours":
            return ms / m2h;

        case "d":
        case "day":
        case "days":
            return ms / h2d;

        default:
            return {
                milliseconds: milliseconds,
                seconds: seconds,
                minutes: minutes,
                hours: hours,
                days: days,
                toString: function() {
                    return stringFormatted;
                },
            };
    }

}

function timer(time, update, complete) {

    function Timer(t, u, c) {
        var start = new Date().getTime();
        var interval = setInterval(function() {
            var now = t - (new Date().getTime() - start);
            if (now <= 0) {
                clearInterval(interval);
                if (typeof c === "function") {
                    c();
                }
            } else if (typeof u === "function") {
                u(Math.floor(now / 1000));

            }
        }, 100); // the smaller this number, the more accurate the timer will be
        this.clearTimer = function clearTimer() {
            clearInterval(interval);
        };
    }
    return new Timer(time, update, complete);
}