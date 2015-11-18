"use strict";

var path = require('path');
var fs = require('fs-extra');
var url = require("url");
var jsonfile = require('jsonfile');
var existsSync = require('exists-sync');

module.exports = function(Lucy, req, res) {
    var vault = path.resolve(req.params.vaultAdd);
    var track = req.params.trackName;
    console.log("streaming", track, "from", req.params.vaultAdd);
    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];

    ret.push(Lucy.talk_or_listen(true) + "<br>");
    if(!req.params.cb){
        ret.push("<br><a onclick='window.history.back();return false;' href=/vault/" + encodeURIComponent(req.params.vaultAdd) + ">⬅Back</a>");
    }else{
        ret.push('<br><a href=' + url.parse(req.params.cb).href + '>⬅Back</a>');
    }
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
            video: ["mp4", "webm"],
            audio: ["mp3", "ogg"]
        };
        var params = encodeURIComponent(req.params.vaultAdd) + "/" + encodeURIComponent(req.params.trackName);
        var tag;
        Object.keys(dirToCheck).forEach(function(key) {
            dirToCheck[key].forEach(function(ext) {
                if (existsSync(req.params.vaultAdd + "/track_" + key + "/" + req.params.trackName + "." + ext)) {
                    tag = "onclick='window.location.href='/download/" + params + "/" + ext + "';return false;' href=/download/" + params + "/" + ext;
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
        
        return res.send(ret.join(""));
    });

};
