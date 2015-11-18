var make = require('../lib/make.js');

function _foobar(Lucy, Ethel, guests_book, req, res) {
    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    Ethel.getMe()
        .then(function(User) {

            ret.push(Lucy.talk_or_listen(true));
            ret.push("<br>Hey there " + User.info.display_name + ", you need to go in " + make.formatTime((new Date(User.expires_at)) - (new Date())) + " @ " + make.formatDate(User.expires_at));
            ret.push("<br>Home @ <a href='/index'>➥" + "Home" + " </a>");

            ret.push("<pre>Access_Token:<br> " + User.access_token);
            ret.push("<br><br>Refresh_Token:<br> " + User.refresh_token);
            ret.push("<pre>Guests List:<br> " + JSON.stringify(guests_book, null, 2));

            ret.push("<br><br>User_Info:<br> " + JSON.stringify(User.info, null, 2) + "</pre>");
            ret.push(
                "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
                "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
                "</script>"
            );
            ret.push("<br><br><a href=logout>Logout</a> <i>*note that if you accessing from other devices, dont logout, cuz you can't log back in cuz spotify callback is set to localhost for now son");
            res.send(ret.join(""));

        }, function(err) {
            ret.push("Hi, I'm Lucy, who are you? => <a href=login>Login</a>");
            ret.push("<br><br>" + Lucy.talk_or_listen(true));
            ret.push("<br>Home @ <a href='/index'>➥" + "Home" + " </a>");
            res.send(ret.join(""));
        }).done();
}

module.exports = _foobar;
