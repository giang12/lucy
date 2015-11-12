"use strict";

var path = require('path');
var fs = require('fs-extra');
var Q = require('q');

var cwd = process.cwd();



function _get_req_url(req, onlyhost) {

    if (onlyhost) return req.protocol + '://' + req.get('host');

    return req.protocol + '://' + req.get('host') + req.originalUrl;
}


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

function _prepStandAlonePlayer(Lucy, fileURI, req) {
    //ok we need to get 
    //console.log(fileURI);
    var type = encodeURIComponent(fileURI.type) + '/' + encodeURIComponent(fileURI.ext);

    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    ret.push(Lucy.talk_or_listen(true));
    ret.push('<br><a onclick=window.location.href="' + encodeURI(_get_req_url(req, true)) + ';return false; href="' + encodeURI(_get_req_url(req, true)) + '"><=Back Index</a>');

    ret.push("<center>");
    var params = encodeURIComponent(fileURI.vaultAdd) + "/" + encodeURIComponent(fileURI.trackName);
    var dtag = "onclick='window.location.href='/download/" + params + "/" + fileURI.ext + "';return false;' href=/download/" + params + "/" + fileURI.ext;

    ret.push("<br><br><b>Download: </b> ");
    ret.push(" <a download " + dtag + " ><b>" + fileURI.trackName + "</b> (" + type + ")</a>");
    ret.push('<br>');
    var at = encodeURIComponent(fileURI.vaultAdd + "/" + fileURI.trackAdd + "/" + fileURI.trackName + '.' + fileURI.ext);
    if (fileURI.type === "video") {
        ret.push('<br><video autoplay style="width:100%; height:80%; min-height:80%; min-width:100%" src="/playback/' + at + '" type="' + type + '" controls></video>');
    } else {
        ret.push('<br><audio autoplay style-"height:50%"" style="width:100%;" src="/playback/' + at + '" type="' + type + '" controls></audio>');
    }
    ret.push("</center");
    return ret.join("");
}

/**
 * mediaFile full path to media file
 * @param  {[type]} mediaFile [description]
 * @return {[type]}           [description]
 */
function _getFileURIComponents(mediaFile) {
    //console.log(mediaFile);
    var file = path.resolve(cwd, mediaFile);

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

module.exports = function(Lucy, req, res) {
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
            if (fileURI.ext === "ogg" || fileURI.ext === "webm") {

                //fs.unlink(fileURI.file, _unlinkHandler);

                errString += "<br>But good news is the corrupted file is recoverable, i'm working on it";
                errString += "<br>Check back later (give me sometime) @ ";
                errString += '<br><a href="/track/' + encodeURIComponent(fileURI.vaultAdd) + "/" + encodeURIComponent(fileURI.trackName) + '">' + _get_req_url(req) + ' </a>';
            }
            return _playback_404(new Error(errString), req, res);
        }

        if (typeof range === 'undefined') {
            res.writeHead(200, {
                "Content-Type": "text/html"
            });
            return res.end(_prepStandAlonePlayer(Lucy, fileURI, req));
        }
        var positions = range.replace(/bytes=/, "").split("-"),
            start = parseInt(positions[0], 10),
            end = positions[1] ? parseInt(positions[1], 10) : total - 1,
            chunksize = (end - start) + 1;

        if (start > end) {
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
}
