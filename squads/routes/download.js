var archiver = require('archiver');
var path = require('path');
var fs = require('fs-extra');
var existsSync = require('exists-sync');

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
module.exports = function(req, res) {

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
}
