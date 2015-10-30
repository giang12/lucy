"use strict";

var net = require('net');
var os = require('os');
var fs = require('fs-extra');
var path = require('path');
var url = require("url");
var util = require('util');
var jsonfile = require('jsonfile');
var expressIO = require('express.io');
var spotify_daemon = require('./lib/spotify-node-applescript.js');
var Youtube = require("youtube-api"),
    Logger = require("bug-killer"),
    Opn = require("opn");
var Q = require('q');
var archiver = require('archiver');
var existsSync = require('exists-sync');
var Ricky = require('./ricky.js');
var Fred = require('./fred.js');
var Ethel = new(require('./ethel.js'))("Ethel");


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

        if (!existsSync("./config")) {

            console.log("set ./config pls");
            throw new Error("set ./config pls");
        }
        quotes = jsonfile.readFileSync("./config/quotes.json");
        vault = jsonfile.readFileSync("./config/vaults.json").main_vault;
        vaultAdd = vault.location + "/" + vault.name;
        vaultKeeper = new Fred(vault.location, vault.name, "Fred");

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


/** And Lucy's Heart Starts Beating : Come  alive*/
Lucy.comeAlive();


var app = expressIO();
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

function _get_req_url(req, onlyhost) {

    if (onlyhost) return req.protocol + '://' + req.get('host');

    return req.protocol + '://' + req.get('host') + req.originalUrl;
}
/**
 * [_downloadZip zip VALID files from list of files and send it, ignore [or include failures maybe when have time]]
 * @param  {[type]} zippedFilename [final zip name]
 * @param  {[type]} files2Zip      [list of files to include] 
    var files2Zip = [{
        address: /path/to/vault/track_vid,
        name: req.params.trackName + ".mp4"
    }, {
        address: /path/to/vault/track_vid,
        name: req.params.trackName + ".webm"
    }, {
        address: /path/to/vault/track_aud,
        name: req.params.trackName + ".mp3"
    }, {
        address: /path/to/vault/track_aud,
        name: req.params.trackName + ".ogg"
    }];
 * @param  {[type]} req            [description]
 * @param  {[type]} res            [description]
 * @return {[type]}                [description]
 */
function _downloadZip(zippedFilename, files2Zip, req, res) {

    var archive = archiver('zip', {
        'name': zippedFilename,
        'comment': 'Created with heart by Giang @ github/giang12'
    });
    var header = {
        "Content-Type": "application/x-zip",
        "Pragma": "public",
        "Expires": "0",
        "Cache-Control": "private, must-revalidate, post-check=0, pre-check=0",
        "Content-disposition": 'attachment; filename="' + zippedFilename + '"',
        "Transfer-Encoding": "chunked",
        "Content-Transfer-Encoding": "binary"
    };
    archive.on('error', function(err) {
        return _downloadFailureHandler(err, req, res);
    })
        .on('end', function() {
            return res.end();
        });
    files2Zip.forEach(function(file, index, arr) {

        var filePath = file.address + "/" + file.name;
        if (existsSync(filePath)) {
            archive.append(fs.createReadStream(filePath), {
                name: file.name,
                'comment': 'Created with heart by Giang @ github/giang12'
            });
        }
    });
    res.writeHead(200, header);
    archive.store = true; // don't compress the archive
    archive.pipe(res); // pipe to output
    archive.finalize();
    return;
}
/**
 * [_downloadFile given file download it or err]
 * @param  {[type]} file [description]
    var file = {
        address: track_vid,
        name: req.params.trackName + ".mp4"
    }
 * @param  {[type]} req  [description]
 * @param  {[type]} res  [description]
 * @return {[type]}      [description]
 */
function _downloadFile(file, req, res) {
    //console.log(file);

    res.download(file.address + "/" + file.name, file.name, function(err) {
        if (err) {
            console.log(err);
            // Handle error, but keep in mind the response may be partially-sent
            // so check res.headersSent
            return _downloadFailureHandler(err, req, res);
        } else {
            // decrement a download credit, etc.
            // 
        }
    });
    return;
}

function _downloadFailureHandler(err, req, res, ie_lol) {
    console.log(err);

    var ret = ['<b>' + req.params.trackName + "." + req.params.op + '</b>'];
    if (ie_lol) {
        ret.push('<br>' + err + '</b>');
    } else {
        ret.push('<br>Nope, coundn\'t download this resource at this time');
        ret.push('<br>But I\'m working hard to fix this');
        ret.push('<br>You can check back later at this link baby ^>^');
        ret.push('<br><a href="' + _get_req_url(req) + '">' + _get_req_url(req) + '</a>');
        ret.push('<br>or');
    }
    ret.push(' search something else in the mean time ^v^');
    ret.push('<br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" name="spotify:track:43wtbrVn3ZSN8sz5MLgg4C or 43wtbrVn3ZSN8sz5MLgg4C or searchTerm" value="">');
    ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');

    ret.push('<br><br><a onclick="window.location.href="' + _get_req_url(req, true) + ';return false; href=' + _get_req_url(req, true) + '<=Back Index</a>');
    ret.push(' | <a href="https://github.com/giang12">Z&#x1F63BG</a>');

    ret.push(
        "<script>function search() {window.location = 'http://localhost:8888/search/' + encodeURIComponent(document.getElementById('searchBox').value);}</script>" +
        "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
        "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
        "</script>"
    );
    res.send(ret.join(''));
}
/**
 * vaultAdd: va
 * trackName: std trackName title-artist [Sorting Things Out-Garden City Movement]
 * op:[mp4 webm ogg mp3]
 */
app.get('/download/:vaultAdd/:trackName/:op', function(req, res) {

    var vault = path.resolve(req.params.vaultAdd);
    //console.log(vault);
    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";

    switch (req.params.op) {
        case "mp4":
        case "webm":
            return _downloadFile({
                address: track_vid,
                name: req.params.trackName + "." + req.params.op
            }, req, res);

        case "mp3":
        case "ogg":
            return _downloadFile({
                address: track_aud,
                name: req.params.trackName + "." + req.params.op
            }, req, res);

        case "all":
            var zippedFilename = req.params.trackName + ".zip";
            var files2Zip = [{
                address: track_vid,
                name: req.params.trackName + ".mp4"
            }, {
                address: track_vid,
                name: req.params.trackName + ".webm"
            }, {
                address: track_aud,
                name: req.params.trackName + ".mp3"
            }, {
                address: track_aud,
                name: req.params.trackName + ".ogg"
            }];
            return _downloadZip(zippedFilename, files2Zip, req, res);

        default:
            var errString = "Nah, there are only 5 ops to choose from [mp4 mp3 ogg webm all]  you used '" + req.params.op + "', sr for the limitation <3";
            return _downloadFailureHandler(new Error(errString), req, res, true);
    }
});

app.get('/error/:reporter/corruption/:file', function(req, res) {
    var reporter = req.params.reporter;
    var trackAdd = req.params.file;
    var file = path.resolve(__dirname, trackAdd);
    var token = trackAdd.split(".");
    var ext = token[token.length - 1];
    var ret = ['<b>' + (token[token.length - 2] || "") + '</b>'];
    ret.push('<br>Hmmm I\'m embarrassed to say but it\'s looked like this file is corrupted =.=\' </b>');
    ret.push('<br>I\'ve already sent out an army of monkeies to fix this');
    ret.push('<br>You can check back later at this link baby ^>^, much later i\'m afraid');
    ret.push('<br><a href="' + reporter + '">' + reporter + '</a>');
    ret.push('<br>or');

    ret.push('search something else in the mean time ^v^');
    ret.push('<br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" name="spotify:track:43wtbrVn3ZSN8sz5MLgg4C or 43wtbrVn3ZSN8sz5MLgg4C or searchTerm" value="">');
    ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');

    ret.push('<br><br><a onclick="window.location.href="' + _get_req_url(req, true) + ';return false; href=' + _get_req_url(req, true) + '<=Back Index</a>');
    ret.push(' | <a href="https://github.com/giang12">Z&#x1F63BG</a>');

    ret.push(
        "<script>function search() {window.location = 'http://localhost:8888/search/' + encodeURIComponent(document.getElementById('searchBox').value);}</script>" +
        "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
        "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
        "</script>"
    );
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.send(ret.join(''));

});
function _playback_404(err, req, res) {

    res.writeHead(404, {
        "Content-Type": "text/html"
    });
    res.end("<br><a onclick='window.location.href='/index';return false;' href=/index><=Back Index</a><br><br>" + err);

}

/**
 * [_prepStandAlonePlayer description]
 * @param  {[type]} mediaFileURI [description]
    var MediaFileFileURI[Components] = {
        file:file,
        trackAdd:trackAdd,
        trackName:trackName,
        vaultAdd:vaultAdd,
        ext:ext.toLowerCase(),
        type:type.toLowerCase()
    }; 
 * @param  {[type]} req          [description]
 * @return {[type]}              [description]
 */

function _prepStandAlonePlayer(fileURI, req){
    //ok we need to get 
    //console.log(fileURI);
    var type =  encodeURIComponent(fileURI.type)+'/'+ encodeURIComponent(fileURI.ext);

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true));
    ret.push('<br><a onclick=window.location.href="' + encodeURI(_get_req_url(req, true)) + ';return false; href="' + encodeURI(_get_req_url(req, true)) + '"><=Back Index</a>');
    
    ret.push("<center>");
    var params = encodeURIComponent(fileURI.vaultAdd) + "/" + encodeURIComponent(fileURI.trackName);
    var dtag =  "onclick='window.location.href='/download/" + params + "/" + fileURI.ext +"';return false;' href=/download/" + params + "/" +fileURI.ext;
    
    ret.push("<br><br><b>Download: </b> ");
    ret.push(" <a download " + dtag + " ><b>" + fileURI.trackName + "</b> ("+type+")</a>");
    ret.push('<br>');
    var at = encodeURIComponent(fileURI.vaultAdd + "/" + fileURI.trackAdd + "/" + fileURI.trackName + '.' + fileURI.ext);
    if(fileURI.type === "video"){
    ret.push('<br><video autoplay style="width:100%; height:80%; min-height:80%; min-width:100%" src="/playback/'+ at +'" type="'+ type +'" controls></video>');
    }else{
     ret.push('<br><audio autoplay style-"height:50%"" style="width:100%;" src="/playback/'+ at +'" type="'+ type +'" controls></audio>');
    }
    ret.push("</center");
    return ret.join("");
}

/**
 * mediaFile full path to media file
 * @param  {[type]} mediaFile [description]
 * @return {[type]}           [description]
 */
function _getFileURIComponents(mediaFile){
    //console.log(mediaFile);
    var file = path.resolve(__dirname, mediaFile);

    var token = file.split("/");
    var fileNameToken = token.pop().split(".");
    var ext = fileNameToken.pop();
    var trackName = fileNameToken.join(".");
    var trackAdd = token.pop();
    var vaultAdd = token.join("/");

    var MediaFileFileURIComponents = {
        file: file,
        trackName: trackName || "",
        trackAdd: trackAdd,
        vaultAdd: vaultAdd,
        ext: ext || "",
        type: trackAdd.split("_").pop() || ""
    };

    return MediaFileFileURIComponents;
}

app.get('/playback/:mediaFile', function(req, res) {
    //console.log(req.params.mediaFile);
    var fileURI = _getFileURIComponents(req.params.mediaFile);

    if ((fileURI.ext !== "mp4" && fileURI.ext !== "mp3" && fileURI.ext !== "webm" && fileURI.ext !== "ogg")) {
        var errString = "I'm sorry, currently I'm only supporting [mp4 mp3 webm ogg]";
        errString += ", sorry im not as awesome as you are, carry one sir/ma'am 'O;O'";

        return _playback_404(new Error(errString), req, res);
    }

    Q.nfcall(fs.stat, fileURI.file).then(
        _file_exist_and_have_stat,
        function(err) {
            console.log(err);
            return _playback_404(new Error("Cannot playback '" + fileURI.trackName + "." + fileURI.ext + "'"), req, res);
        }
    );
    function _unlinkHandler(err) {

        if (err && err.code !== "ENOENT") {

            console.log(err);
        }
        return;
    }

    function _file_exist_and_have_stat(stats) {

        var total = stats.size,
            file_size_in_mb = total / 1000000,
            range = req.headers.range;
        if (file_size_in_mb < 1) {

            console.log("FOUND AN ERRONOUS MEDIA FILE @", fileURI.file);
            var errString = "Erronous File: Cannot playback '" + fileURI.trackName + "." + fileURI.ext + "'";
            if(fileURI.ext === "ogg" || fileURI.ext === "webm"){
                
                //fs.unlink(fileURI.file, _unlinkHandler);
                
                errString += "<br>But good news is the corrupted file is recoverable, i'm working on it";
                errString += "<br>Check back later (give me sometime) @ ";
                errString += '<br><a href="/track/'+ encodeURIComponent(fileURI.vaultAdd) + "/" + encodeURIComponent(fileURI.trackName) +'">' + _get_req_url(req)+ ' </a>';
            }
            return _playback_404(new Error(errString), req, res);
        }

        if (typeof range === 'undefined') {
            res.writeHead(200, {
                "Content-Type": "text/html"
            });
            return res.end(_prepStandAlonePlayer(fileURI, req));
        }
        var positions = range.replace(/bytes=/, "").split("-"),
            start = parseInt(positions[0], 10),
            end = positions[1] ? parseInt(positions[1], 10) : total - 1,
            chunksize = (end - start) + 1;

        if(start > end){
            //err playback 
            //emit something its running in <video> container
        }
        //(fileURI.type === 'video') ? "video/mp4" : "audio/mp3" 
        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": fileURI.type + "/" + fileURI.ext
        });

        var stream = fs.createReadStream(fileURI.file, {
                start: start,
                end: end
            })
            .on("open", function() {
                stream.pipe(res);
            }).on("error", function(err) {
                res.end(new Error(err) + "");
            });
    }
});
// app.get('/refresh_token', Ethel.refresh_token);
app.get('/vault/:vaultAdd/:orderBy?', function(req, res) {

    var vault = path.resolve(req.params.vaultAdd);
    var orderBy = req.params.orderBy || "a";

    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true) + "<br>");
    ret.push("<br><a onclick='window.history.href='/index';return false;' href=/index>⬅Back Index</a> | <A HREF='javascript:history.go(0)'>&#8634 Click to refresh the page</A>");
    ret.push("<br>Vault is set to " + path.resolve(req.params.vaultAdd));

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
        var aCommand = orderBy === 'a' ? "class=active>➥" : (aTag + "/a>");
        var Lcommand = orderBy === 'l' ? "class=active>➥" : (aTag + "/l>");
        var Ccommand = orderBy === 'c' ? "class=active>➥" : (aTag + "/c>");

        ret.push("<br>There are tracks <b>" + total + "</b> in vault orderBy <a " + aCommand + "Alphabet</a> | <a " + Lcommand + "Lastest</a> | <a " + Ccommand + "Chronological</a>");
        ret = ret.concat(trackList);
        ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "addStyleString('#track-list{ height:80%; width:90%; overflow-y:auto; overflow-x:hidden}');" +
            "</script>"
        );
        return res.send(ret.join(""));
    });

});

app.get('/track/:vaultAdd/:trackName', function(req, res) {
    var vault = path.resolve(req.params.vaultAdd);
    var track = req.params.trackName;
    console.log("streaming", track, "from", req.params.vaultAdd);
    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];

    ret.push(Lucy.talk_or_listen(true) + "<br>");
    ret.push("<br><a onclick='window.history.back();return false;' href=/vault/" + encodeURIComponent(req.params.vaultAdd) + ">⬅Back</a>");
    ret.push("<center><b>" + track + "</b></center>");
    ret.push("<center>");
    jsonfile.readFile(track_info + "/" + track, function(err, info) {
        if (err) {
            console.log(err);

            /**USE RICKY TO SEARCH THEN FRED TO SAve TO vaultAdd
            console.log(req.params.trackName);
            */
            ret.push("<br>" + "Look like this song is not in vault " + req.params.vaultAdd + "<br>");
            ret.push("<br>" + "Let's me go find it for you in a sec, check back later <>< <STILL NEED TO BE IMPLEMENTED>" + "<br>");
            return res.send(ret.join(""));
        }


        ret.push('<br><video controls style="width:100%; height: 80%; min-width: 100%; min-height:80%" autoplay><source src="/playback/' + encodeURIComponent(info.paths.yt_vid) + ".mp4" + '" type="video/mp4">Your browser does not support HTML5 video.</video>');
        ret.push('<br><br>Audio Only: <audio controls><source src="/playback/' + encodeURIComponent(info.paths.yt_aud) + ".mp3" + '" type="audio/mp3">Your browser does not support HTML5 audio.</audio>');
        ret.push("<br><br><b>Download: </b>");

        var dirToCheck = {
            video : ["mp4", "webm"],
            audio : ["mp3", "ogg"]
        };
        var params = encodeURIComponent(req.params.vaultAdd) + "/" + encodeURIComponent(req.params.trackName);
        var tag;
        Object.keys(dirToCheck).forEach(function(key){
            dirToCheck[key].forEach(function(ext){
                if(existsSync(req.params.vaultAdd + "/track_" + key + "/"  + req.params.trackName + "." + ext)){
                    tag = "onclick='window.location.href='/download/" + params + "/" + ext +"';return false;' href=/download/" + params + "/" + ext;
                    ret.push(" <a download " + tag + ">➥" + key + "/" + ext + "</a> |");
                }
            });
        });
        tag = "onclick='window.location.href='/download/" + params + "/all';return false;' href=/download/" + params + "/all";
        ret.push(" <a download " + tag + " >➥Wanna have it all?(zip)</a>");


        ret.push('</center>');
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
            ret.push(Lucy.talk_or_listen(true));
            ret.push("<br>Hey there " + User.info.display_name + ", you need to go in " + formatTime((new Date(User.expires_at) - new Date())) + " @ " + formatDate(User.expires_at));
            ret.push("<br><br>Vault Address @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + (Lucy.where_is_your_vault()) + " </a>");

            ret.push('<center><br><br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" name="spotify:track:43wtbrVn3ZSN8sz5MLgg4C or 43wtbrVn3ZSN8sz5MLgg4C or searchTerm" value="">');
            ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');

            ret.push("<pre>Access_Token:<br> " + User.access_token);
            ret.push("<br><br>Refresh_Token:<br> " + User.refresh_token);
            ret.push("<br><br>User_Info:<br> " + JSON.stringify(User.info, null, 2) + "</pre>");
            ret.push(
                "<script>function search() {window.location = '/search/' + encodeURIComponent(document.getElementById('searchBox').value);}</script>" +
                "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
                "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
                "</script>"
            );
            ret.push("<br><br><a href=logout>Logout</a> <i>*note that if you accessing from other devices, dont logout, cuz you can't log back in cuz spotify callback is set to localhost for now son");
            res.send(ret.join(""));

        }, function(err) {
            ret.push("Hi, I'm Lucy, who are you? => <a href=login>Login</a>");
            ret.push("<br><br>" + Lucy.talk_or_listen(true));
            ret.push("<br>Vault Address @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + (Lucy.where_is_your_vault()) + " </a>");
            ret.push('<center><br><br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" name="spotify:track:43wtbrVn3ZSN8sz5MLgg4C or 43wtbrVn3ZSN8sz5MLgg4C or searchTerm" value="">');
            ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');
            ret.push("<script>function search() {window.location = '/search/' + document.getElementById('searchBox').value};</script>");
            res.send(ret.join(""));
        }).done();
});

app.get("/search/:q", function(req, res) {

    var searchTerm = req.params.q ? req.params.q : "";
    var ret = [];

    ret.push(Lucy.talk_or_listen(true));
    ret.push("<br><br><a onclick='window.location.href='/index';return false;' href=/index><=Back Index</a>");

    console.log("searching for", searchTerm);
    Lucy.do_you_have_this_track(searchTerm).then(function(newSong) {

        res.redirect("/track/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/" + encodeURIComponent(newSong.fileName));
    }, function(err) {
        console.log('Fail to find anything about ' + searchTerm);
        console.log('Due to reason', err);
        ret.push("<br><br>" + err);
        res.send(ret.join(""));
    }).done();

});

app.get('*', function(req, res) {

    res.redirect("/index");

});

app.listen(port);
console.log('Lucy is running @ ' + (app));

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
    // if you want to add seconds
    replacement += ":" + s;
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

    var _milliseconds = ms % 1000 || 0;
    var _seconds = Math.floor(ms / ms2s) % 60 || 0;
    var _minutes = Math.floor(ms / s2m) % 60 || 0;
    var _hours = Math.floor(ms / m2h) % 24 || 0;
    var _days = Math.floor(ms / h2d) || 0;
    var _stringFormatted = (_days !== 0 ? _days + (_days > 1 ? " days " : " day ") : "") +
        (_hours !== 0 ? _hours + (_hours > 1 ? " hours " : " hour ") : "") +
        (_minutes !== 0 ? _minutes + (_minutes > 1 ? " minutes " : " minute ") : "") +
        (_seconds !== 0 ? _seconds + (_seconds > 1 ? " seconds " : " second ") : "");
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
                milliseconds: _milliseconds,
                seconds: _seconds,
                minutes: _minutes,
                hours: _hours,
                days: _days,
                toString: function() {
                    return _stringFormatted;
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