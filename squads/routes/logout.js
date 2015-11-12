function _logout(Lucy, req, res) {

    Lucy.sleep();
    res.redirect("/index");
}

module.exports = _logout;
