module.exports = function (Lucy, Ethel, req, res) {
    var code = req.query.code || null;

    Ethel.getUser(code).then(
        function(user) {
            //console.log(user);
            Lucy.wakeup(user);
            res.redirect("/index");
        },
        function(err) {
            //Lucy.sleep();
            res.redirect("/index");
        }).done();

};
