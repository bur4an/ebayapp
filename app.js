/*
Module Dependencies 
*/
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    hash = require('./pass').hash,
    request = require('./request'),
    bodyParser = require('body-parser'),
    ebay = require('ebay-api'),
    keys = require('./keys');
var app = express();

/*
Database and Models
*/
mongoose.connect("mongodb://localhost/myapp");
var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    salt: String,
    hash: String
});

var User = mongoose.model('users', UserSchema);
/*
Middlewares and configurations 
*/
app.configure(function () {
    app.use(express.bodyParser());
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.cookieParser('Authentication Tutorial '));
    app.use(express.session());
    app.use(express.static(path.join(__dirname, 'public')));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
});

app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});
/*
Helper Functions
*/
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);

    User.findOne({
        username: name
    },

    function (err, user) {
        if (user) {
            if (err) return fn(new Error('cannot find user'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        } else {
            return fn(new Error('cannot find user'));
        }
    });

}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
}

/*
Routes
*/
app.get("/", function (req, res) {

    if (req.session.user) {
        //res.send("Welcome " + req.session.user.username + "<br>" + "<a href='/listing'>logout</a>");
        res.redirect('/listing');
    } else {
        //res.send("<a href='/login'> Login</a>" + "<br>" + "<a href='/signup'> Sign Up</a>");
        res.redirect('/login');
    }
});

/*app.get("/signup", function (req, res) {
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("signup");
    }
});

app.post("/signup", userExist, function (req, res) {
    var password = req.body.password;
    var username = req.body.username;

    hash(password, function (err, salt, hash) {
        if (err) throw err;
        var user = new User({
            username: username,
            salt: salt,
            hash: hash,
        }).save(function (err, newUser) {
            if (err) throw err;
            authenticate(newUser.username, password, function(err, user){
                if(user){
                    req.session.regenerate(function(){
                        req.session.user = user;
                        req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                        res.redirect('/');
                    });
                }
            });
        });
    });
});*/

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {

            req.session.regenerate(function () {

                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/profile">/restricted</a>.';
                res.redirect('/listing');
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.redirect('/login');
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/login');
    });
});

app.get('/listing', requiredAuthentication, function(req, res){
    res.render('index', {list: request.items});
});
app.post('/listing', requiredAuthentication, request.list, request.seller, request.cost, function (req, res) {
    res.redirect('/listing');      
});
app.post('/update', requiredAuthentication, function (req, res) {
    //console.log(request.revisedItem);
    console.log(req.body);
    if (req.body.price > 0 && req.body.id)
        ebay.xmlRequest({
            serviceName: 'Trading',
            opType: 'ReviseFixedPriceItem',
            devId: keys.devId,
            certId: keys.certId,
            appId: keys.appId,
            sandbox: false,
            authToken: keys.token,
            params: {
                Item: {
                    ItemID: req.body.id,
                    StartPrice: req.body.price,
                }
            }
        }, function(er, update) {
            // ...
            if (er) console.log(er);
            if (update)
                res.send(update);
            else
                res.send(er)
        });
    //res.send()
});
http.createServer(app).listen(3000);