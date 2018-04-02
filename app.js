var express = require("express");
var app = express();
var bodyParser  = require("body-parser");
var mongoose = require("mongoose");
var path = require('path');
var __dirname = path.resolve();
var flash       = require("connect-flash");
var passport    = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");



app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());


// Mongoose beallitasa
mongoose.connect("mongodb://localhost/webapp");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});
userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema); //a "User"-ből 1 db.users lesz az adatbazisban

//Passport
app.use(require("express-session")({
    secret: "A kettestol nincs jobb jegy",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
 }); //ezek az adatok mindig elérhetőek

app.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Kijelentkeztel!");
    res.redirect("/register"); //barhova atiranyithatjuk
 });


app.get("/register", function(req, res){
    res.render("register");
 });
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Sikerült bejelentkezni " + user.username);
           res.redirect("/login"); //általában főoldalra irányítjuk át("/"), de ebben az app-ban nincs.
        });
    });
});
app.get("/login", function(req, res){
    res.render("login");
 });
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/login", //ha sikerült
        failureRedirect: "/register"
    }), function(req, res){
});
app.listen(3000, function(){
    console.log("webapp fut")
});
/*
app.get("/register", function(req, res){
    res.sendFile(__dirname+"/"+"register.html");
}); ez csak html dokumentumot küld amit elkap a böngésző, de nekünk szerver oldali renderelés kell mert adatokat is adunk át

app.post("/register", function(req, res){
    User.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    }, function(err, adatok){
        if(err){
            console.log(err);
        } else{
            console.log(adatok);
            res.redirect("/register");
        }
    });
});
}); ez azért nem jó, mert a felhasznalonevet és a jelszót titkosítás nélkül mentjük el, de bármi más adat mentésére működik


/*
var valaki= new User({
    username: "felhasznalonev",
    password: "valamijelszo",
    email: "valami@valami.com"
})
valaki.save((function(err, User){  // valaki.save() is jo csak akkor nem tudjuk hogy van e valami baja
    if(err){
        console.log("valami nem jo")
    } else {
        console.log("valakit elmentett az adatbazisba")
        console.log(valaki);
    }
}));
User.create() -el is meg lehet ugyanezt csinálni.
*/
