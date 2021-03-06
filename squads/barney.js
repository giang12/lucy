"use strict";

var expressIO = require('express.io');
var fs = require('fs-extra');
var bodyParser = require('body-parser');
var logger = require('morgan');
var compression = require('compression');
var methodOverride = require('method-override');
var requestIp = require('request-ip');
var jsonfile = require('jsonfile');
var Ethel = require('./ethel.js');

var PORT = process.env.PORT || 8888;

var cwd = process.cwd();

var Barney = (function() {

    var my = {};
    my.name = "Barney Stinson";
    my.trueStory = "\u201CJesus waited threedays to come back to life. It was perfect! If he had only waited one day, a lot of people wouldn\u2019t have even heard he died. They\u2019d be all, \u201CHey Jesus, what up?\u201D and Jesus would probably be like, \u201CWhat up? I died yesterday!\u201D and they\u2019d be all, \u201CUh, you look pretty alive to me, dude\u2026\u201D and then Jesus would have to explain how he was resurrected, and how it was a miracle, and the dude\u2019d be like \u201CUhh okay, whatever you say, bro\u2026\u201D And he\u2019s not gonna come back on a Saturday. Everybody\u2019s busy, doing chores, workin\u2019 the loom, trimmin\u2019 the beard, NO. He waited the perfect number of days, three. Plus it\u2019s Sunday, so everyone\u2019s in church already, and they\u2019re all in there like \u201COh no, Jesus is dead\u201D, and then BAM! He bursts in the back door, runnin\u2019 up the aisle, everyone\u2019s totally psyched, and FYI, that\u2019s when he invented the high five. That\u2019s why we wait three days to call a woman, because that\u2019s how long Jesus wants us to wait\u2026. True story.\u201D";
    my.Ethel = null;
    my.Lucy = null;
    my.heartIsBeating = false;
    my.guests_book = null;
    my.guests_book_location = cwd + "/.logs/guests_book.json";
    /**
     * Using angular dependncy injection shit to set up routes lol
     * this is fun
     * [arg1,arg2,arg3..,etc,function2Call]
     * @type {Object}
     */
    
    my.routes = {
    	get:{
    		'/login'		: ["Ethel", require('./routes/login.js')],
    		'/logout'		: ["Lucy", require('./routes/logout.js')],
    		'/authCallback'	: ["Lucy", "Ethel", require('./routes/authCallback.js')],
    		//'/refresh_token': [function(req, res){return my.Ethel.refresh_token(req, res);}],
    		'/vault/:vaultAdd/:orderBy?' : ["Lucy", require('./routes/vault.js')],
    		'/track/:vaultAdd/:trackName/:cb?/:foobar?' : ["Lucy", require('./routes/track.js')],
    		'/search/:q' : ["Lucy", require('./routes/search.js')],
    		'/playback/:mediaFile': ["Lucy", require('./routes/playback.js')],
    		'/download/:vaultAdd/:trackName/:op' : [require('./routes/download.js')],
    		'/index/:orderBy?'		: ["Lucy", "Ethel", require('./routes/index.js')],
            '/foobar'       : ["Lucy", "Ethel", "guests_book", require('./routes/foobar.js')],
    		'*'				: [function(req, res) {res.redirect("/index");}],
    	}
    }
    my.app = expressIO();

    //appwide middlwares
    my.app.use(compression());
    my.app.use(methodOverride('X-HTTP-Method'))          // Microsoft
    my.app.use(methodOverride('X-HTTP-Method-Override')) // Google/GData
    my.app.use(methodOverride('X-Method-Override'))      // IBM
    my.app.use(logger(':remote-addr @ [:date] :status :response-time ":method :url HTTP/:http-version"  ":referrer" ":user-agent"', {
      stream: fs.createWriteStream(cwd + '/.logs/http-serve.log', {'flags': 'a'})
    }));
    my.app.use(bodyParser.json());
    my.app.use(bodyParser.urlencoded({ extended: false }));

    //public stuff to return, all other stuff kept internal
    my.awesomeness = {
    	comeAlive: _I_love_everything_about,
    	trueStory: my.trueStory,
    	name: my.name,
    	isAlive: _isAlive
    };

    //all get middleware
    function _getCB(req, res) {
        //extend for individual route middlewares here
        var key = req.route.path;
        var getRoutes = my.routes.get;
        var _payload = getRoutes[key];
        var _func = _payload[_payload.length - 1]; //extract cb
        var _args = [];

        //injecting dependenies
        for (var x = 0; x < _payload.length - 1; x++) {
            if (my.hasOwnProperty(_payload[x])) {
                _args.push(my[_payload[x]]);
            } else {
                _args.push(null);
            }
        }
        _args.push(req);
        _args.push(res);

        return _func.apply(undefined, _args);
    }	

    function _set_up_routes() {

        //set up middlewares for all gets
        my.app.use(my.ipMiddleware);

        for (var key in my.routes.get) {

            if (!my.routes.get.hasOwnProperty(key)) return;

            console.log(my.name, 'is setting up get route', key);
            my.app.get(key, _getCB);
        }
    }

    my.ipMiddleware = function _ipMiddleware(req, res, next) {
        var clientIp = requestIp.getClientIp(req); // on localhost > 127.0.0.1 
        if(my.guests_book.hasOwnProperty(clientIp)){

            my.guests_book[clientIp]["recent"] = (new Date()).toString();
        }else{
            my.guests_book[clientIp] = {
                "since" : (new Date()).toString(),
                "recent": (new Date()).toString()
            };
        }
        _log_guests_book();
        next();
    };

    my._should_log_guests_book = true;
    my._should_log_guests_book_timer = null;

    function _log_guests_book(){

        if(my._should_log_guests_book === false) return;

        jsonfile.writeFile(my.guests_book_location, my.guests_book, function (err) {
          
          if(err){
            console.error(err);
            }else{
                my._should_log_guests_book = false;
                //set interval
                my._should_log_guests_book_timer = setTimeout(function _should_log_guests_book_setTimeout(){ my._should_log_guests_book = true; }, 720000);//720000only log every 12 mins
    
            }
        });
    }

    function _isAlive(){

    	return my.heartIsBeating;
    }

    function _I_love_everything_about(_Lucy_) {
        /*and I'm not a guy who says that lightly, I'm a guy who has faked love his entire life, I'm a guy who thought love was just something idiots felt, but this woman has a hold on my heart that I could not break if I wanted to. And there have been times when I wanted to. It has been overwhelming and humbling, and even painful at times, but I could not stop loving her any more than I could stop breathing. I'm hopelessly, irretrievably in love with her. More than she knows.
         */
        if (my.heartIsBeating) return;
        
        jsonfile.readFile(my.guests_book_location, function(err, obj) {
            if(err){
                my.guests_book = {
                    //"ip":{
                    //  "since": date
                    //  "most_recent": date
                    //}
                };
                return;
            }
            my.guests_book = obj;
            return;
        });

        my.Ethel = new Ethel("Ethel");
        my.Lucy = _Lucy_;
        my.heartIsBeating = true;

        _set_up_routes();
        my.app.listen(PORT);

		console.log(my.Lucy.name,'&', my.name,'are running @ port ' + PORT);

        return my.awesomeness;
    }

    return my.awesomeness;
})();

module.exports = Barney;

// app.get('/error/:reporter/corruption/:file', function(req, res) {
//     var reporter = req.params.reporter;
//     var trackAdd = req.params.file;
//     var file = path.resolve(__dirname, trackAdd);
//     var token = trackAdd.split(".");
//     var ext = token[token.length - 1];
//     var ret = ['<b>' + (token[token.length - 2] || "") + '</b>'];
//     ret.push('<br>Hmmm I\'m embarrassed to say but it\'s looked like this file is corrupted =.=\' </b>');
//     ret.push('<br>I\'ve already sent out an army of monkeies to fix this');
//     ret.push('<br>You can check back later at this link baby ^>^, much later i\'m afraid');
//     ret.push('<br><a href="' + reporter + '">' + reporter + '</a>');
//     ret.push('<br>or');

//     ret.push('search something else in the mean time ^v^');
//     ret.push('<br><input style="width: 80%; height:50px; font-size:24px;" id="searchBox" type="text" name="spotify:track:43wtbrVn3ZSN8sz5MLgg4C or 43wtbrVn3ZSN8sz5MLgg4C or searchTerm" value="">');
//     ret.push('<br><br><input onclick=search() style="width: 30%; height:45px; font-size:24px;" type="submit" value="Search"></center>');

//     ret.push('<br><br><a onclick="window.location.href="' + _get_req_url(req, true) + ';return false; href=' + _get_req_url(req, true) + '<=Back Index</a>');
//     ret.push(' | <a href="https://github.com/giang12">Z&#x1F63BG</a>');

//     ret.push(
//         "<script>function search() {window.location = 'http://localhost:8888/search/' + encodeURIComponent(document.getElementById('searchBox').value);}</script>" +
//         "<script>(function() {var node = document.createElement('style');document.body.appendChild(node);window.addStyleString = function(str) {node.innerHTML = str;}}());" +
//         "addStyleString('pre{white-space: pre-wrap;white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap;word-wrap: break-word;}');" +
//         "</script>"
//     );
//     res.writeHead(200, {
//         "Content-Type": "text/html"
//     });
//     res.send(ret.join(''));

// });


