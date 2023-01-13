require("dotenv").config();
const express = require('express')
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("Public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/hrmsUserDB", {useNewUrlParser: true});


const userSchema = new mongoose.Schema({
    email:String,
    password:String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

app.get("/", function(req, res){
    res.render('login')
})

function isAuthenticated(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/');
}

app.get("/dashboard", isAuthenticated, function(req, res){
    User.findOne({"account":{$ne: null}}, function(err, foundUser){
        if(err){
            console.log(err);
        }else {
            if(foundUser){
                res.render("dashboard");
            }else{
                res.render('login');
            }
        }
    })
});

app.post("/login", function(req, res){

    const user = new User({
        username:req.body.username,
        passport:req.body.password
    })

    req.logIn(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect('dashboard');
            })
        }
    })
});

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      
      res.redirect('/');
    });
});

app.listen(3000, function(){
    console.log('server started on port 3000')
})