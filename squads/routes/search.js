module.exports = function(Lucy, req, res) {

    var searchTerm = req.params.q ? req.params.q : "";
    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];

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

};
