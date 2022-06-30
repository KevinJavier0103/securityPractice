
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
// las siguientes son usadas para encrypt, hashing y salting 
//const encrypt = require('mongoose-encryption');
//const md5 = require ("md5");
// const bcrypt= require ("bcrypt");
// const saltRounds = 10;
//los siguientes npm son usados para generar cookies y sessions
// para esta seccion se detallara con numero los pasos utilizados 
//1
const session= require ("express-session");
//2
const passport = require ("passport");
//3
// no se llama passport-local ya que se encuentra explicita
const passportLocalMongoose = require ("passport-local-mongoose");
//11
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//15
const findOrCreate = require('mongoose-find-or-create');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//4 se crea un objeto de js en el cual se especifica l
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false, 
})); 
//5 inicializacion de passport
app.use(passport.initialize());
app.use(passport.session());
// Data base is not active actually is only conected to the local server 
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userScheema = new mongoose.Schema ({
    email:String,
    password:String,
    googleId:String
});

// 6 esta seccion realiza el hash and salt 
userScheema.plugin(passportLocalMongoose);
//16
userScheema.plugin(findOrCreate);

// Esta seccion permite realizar un encriptado de la clave ingresada en la base de datos
// process.env.nombre en el documento .env es la forma de llamar a las variables que se enceuntran almancenadas
// estas variables por lo general son codigos de encriptado o de API 
//userScheema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userScheema);

// 7
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//18 se reemplaza la seccion anterior ya que no se encuentra para globalizada para el caso

passport.serializeUser((user, done)=>{
    done(null, user.id);
});
passport.deserializeUser((id, done)=>{
    User.findById(id, (err, user)=>{
        done( err, user);
    });
});

//12
passport.use(new GoogleStrategy({
    //13
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    //14 instalar findOrCreate es un npm
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) =>{
    res.render("home");
});
//16
app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"]}));

//17 
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");

});
// 9
app.get("/secrets", (req, res)=>{
    if( req.isAuthenticated()){

        res.render("secrets");

    }else {
        res.redirect("/login")
    }
});

app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/");
});
    



app.post("/register", (req, res)=>{


    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

    //     // la funcion md5 es usada para la generacion de un codigosecreto y poder almacenar de una forma mas segura los codigos
    //     // md5 es un npm
    // const newUser = new User({
    //     email:req.body.username,
    //     password:hash
    // });
    // newUser.save((err)=>{
    //     if(!err){
    //         res.render("secrets");
    //     }else {
    //         console.log(err);
    //     }
    // });
    // });
//8 
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets")
            })
        }
    })
    
});


app.post("/login", (req, res)=>{
    // la siguiente seccion fue utilizada con las secciones de encript hashing and salting es necesario especificar que seccion corresponde
    // a cada una ya que no es lo mismo para todas
    // const username= req.body.username;
    // // con la opcion de md5 se procede a igualar el valor de ingreso ya que debe ser el mismo valor
    // const pasword= req.body.password;

    // User.findOne({email:username}, (err,foundUser)=>{

    //     if(err){
    //         console.log(err)
    //     }else if (foundUser) {

    //         bcrypt.compare(pasword, foundUser.password, function(err, result) {
    //             if (result === true){
    //                 res.render("secrets");
    //             }
    //         });
                
    //     }
    // })
//10
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if (err){
            console.log(err);

        }else{
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets")
            })
            
        }
    })

});


app.listen(3000, ()=>{
    console.log("Server started at port 3000");
});