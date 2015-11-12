"use strict";

var path = require('path');
var fs = require('fs-extra');

function _get_req_url(req, onlyhost) {

    if (onlyhost) return req.protocol + '://' + req.get('host');

    return req.protocol + '://' + req.get('host') + req.originalUrl;
}

module.exports = function(Lucy, req, res) {

    var vault = path.resolve(req.params.vaultAdd);
    var orderBy = req.params.orderBy || "a";

    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true) + "<br>");
    ret.push("<br><a onclick='window.history.href='/index';return false;' href=/index>⬅Back Index</a> | <A HREF='javascript:history.go(0)'>&#8634 Click to refresh the page</A>");
    ret.push("<br>Vault is set to " + path.normalize(req.params.vaultAdd));

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
                var params = encodeURIComponent(req.params.vaultAdd) + "/" + encodeURIComponent(elm) + "/" + encodeURIComponent(_get_req_url(req));
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

        ret.push("<br>There are <b>" + total + "</b> tracks in vault orderBy <a " + aCommand + "Alphabet</a> | <a " + Lcommand + "Lastest</a> | <a " + Ccommand + "Chronological</a>");
        ret = ret.concat(trackList);
        ret.push(
            "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
            "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
            "addStyleString('#track-list{ height:80%; width:90%; overflow-y:auto; overflow-x:hidden}');" +
            "</script>"
        );
        return res.send(ret.join(""));
    });

};
