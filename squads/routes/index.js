var make = require('../lib/make.js');
var path = require('path');
var fs = require('fs-extra');

function _get_req_url(req, onlyhost) {

    if (onlyhost) return req.protocol + '://' + req.get('host');

    return req.protocol + '://' + req.get('host') + req.originalUrl;
}

function _index(Lucy, Ethel, req, res) {

    var vaultAdd = Lucy.where_is_your_vault();
    var vault = path.resolve(vaultAdd);
    var orderBy = req.params.orderBy || "l";

    var track_info = vault + "/track_info";
    var track_aud = vault + "/track_audio";
    var track_vid = vault + "/track_video";
    var total = 0;

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true));
    Ethel.getMe()
        .then(function(User) {

            var currentTrack = Lucy.get_curr_listen();
            ret.push("<br>Hey there " + User.info.display_name + ", you need to go in " + make.formatTime((new Date(User.expires_at)) - (new Date())) + " @ " + make.formatDate(User.expires_at));
            ret.push("<br>Home @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + (Lucy.where_is_your_vault()) + " </a>");
            if(currentTrack === null) return;
            
            var token = currentTrack.paths.self.split("/");
            var elm = token.pop();
            token.pop();//track_info
            var vaultAdd = token.join("/");
            var params = encodeURIComponent(vaultAdd) + "/" + encodeURIComponent(elm) + "/" + encodeURIComponent(_get_req_url(req));
            ret.push('<a  onclick="window.location.href="/track/' + params + '";return false;" href="/track/' + params + '">')
                ret.push('<br>&#9833Currently Listening To: ' + currentTrack.fileName);
            ret.push('</a>')

        }, function(err) {

        }).finally(function() {
            // Always execute this on both error and success
            fs.readdir(track_info, function(err, tracks) {
                if (err) {
                    ret.push("<br>" + new Error(err) + "<br>");
                    return res.send(ret.join(""));
                }
                total = tracks.length;
                var trackList = [];
                trackList.push('<br><div id="vault_items">');
                trackList.push('<center><input class="search" style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" placeholder="song artist" value="">');
                trackList.push('<br><br><button onclick="this.disabled=true; search(this);" style="width: 30%; height:40px; font-size:16px;" value="Search">Search</button></center>');
               
                trackList.push('<ul class="pagination"></ul>');

                trackList.push('<ol class="list" id="track-list" type="1">');
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
                        var params = encodeURIComponent(vaultAdd) + "/" + encodeURIComponent(elm) + "/" + encodeURIComponent(_get_req_url(req));
                        trackList.push("<li><a class='name' onclick='window.location.href='/track/" + params + "';return false;' href=/track/" + params + ">➥" + elm + " </a></li><br>");
                    } else {
                        total--;
                    }
                });
                trackList.push("</ol>");
                trackList.push('</div>');

                var aTag = "onclick='window.location.href='/index';return false;' href=/index";
                var aCommand = orderBy === 'a' ? "class=active>➥" : (aTag + "/a>");
                var Lcommand = orderBy === 'l' ? "class=active>➥" : (aTag + "/l>");
                var Ccommand = orderBy === 'c' ? "class=active>➥" : (aTag + "/c>");

                ret.push('<center>');
                ret.push('<pre>)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_<br>&nbsp(__&nbsp;(_( (_&nbsp;(_(<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_)</pre>');
                ret.push("There are <b>" + total + "</b> tracks in Lucy's vault orderBy <a " + aCommand + "Alphabet</a> | <a " + Lcommand + "Lastest</a> | <a " + Ccommand + "Chronological</a>");
                ret.push('</center>');
                ret = ret.concat(trackList);

                ret.push('<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>');        
                ret.push('<script src="http://listjs.com/no-cdn/list.js"></script>');
                ret.push('<script src="http://listjs.com/no-cdn/list.pagination.js"></script>');
                ret.push(
                    "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());"
                        + "addStyleString('"
                            + " pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}"
                            + "#track-list{ height:80%; width:90%; overflow-y:auto; overflow-x:hidden}"
                            + ".pagination li{ display:inline-block; padding:5px; }"
                            + ".pagination li a{ text-decoration: none; color: blue }"
                            + ".pagination .active a{ text-decoration: underline; color: purple }"
                        + "');"
                    + "</script>"
                );

                ret.push("<script>function search(elm) { if (/^\s*$/.test(document.getElementById('searchBox').value)) {elm.disabled=false; return;} window.location = '/search/' + encodeURIComponent(document.getElementById('searchBox').value) };</script>");
                ret.push('<script>var vaultList = new List("vault_items", {valueNames: [ "name"], page: '+ 100 +', plugins: [ ListPagination({ name: "pagination", paginationClass: "pagination", innerWindow: 8, outerWindow: 2}) ] });</script>');

                return res.send(ret.join(""));
            });
        }).done();
}

module.exports = _index;
