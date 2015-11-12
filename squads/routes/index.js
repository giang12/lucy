var make = require('../lib/make.js');

function _index(Lucy, Ethel, req, res) {
    var ret = ['<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'];
    Ethel.getMe()
        .then(function(User) {

            ret.push(Lucy.talk_or_listen(true));
            ret.push("<br>Hey there " + User.info.display_name + ", you need to go in " + make.formatTime((new Date(User.expires_at)) - (new Date())) + " @ " + make.formatDate(User.expires_at));
            ret.push("<br>Home @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + (Lucy.where_is_your_vault()) + " </a>");

            ret.push('<center><br><br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" placeholder="song artist" value="">');
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
            ret.push("<br>Home @ <a onclick='window.location.href='/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l';return false;' href=/vault/" + encodeURIComponent(Lucy.where_is_your_vault()) + "/l>➥" + (Lucy.where_is_your_vault()) + " </a>");
            ret.push('<center><br><br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" placeholder="song artist" value="">');
            ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');
            ret.push("<script>function search() {window.location = '/search/' + document.getElementById('searchBox').value};</script>");
            res.send(ret.join(""));
        }).done();
}

module.exports = _index;
