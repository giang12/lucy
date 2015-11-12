function _login(Ethel, req, res) {

    var authorizeURL = Ethel.getSpotifyApi().createAuthorizeURL(Ethel.scopes);
    // your application requests authorization
    res.redirect(authorizeURL);
};

module.exports = _login;
