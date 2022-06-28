
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userScheema = new mongoose.Schema ({
    email:String,
    password:String
});

// Esta seccion permite realizar un encriptado de la clave ingresada en la base de datos
// process.env.nombre en el documento .env es la forma de llamar a las variables que se enceuntran almancenadas
// estas variables por lo general son codigos de encriptado o de API 
userScheema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userScheema)

app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");

});

app.post("/register", (req, res)=>{

    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save((err)=>{
        if(!err){
            res.render("secrets");
        }else {
            console.log(err);
        }
    });
});

app.post("/login", (req, res)=>{
    const username= req.body.username;
    const pasword= req.body.password;

    User.findOne({email:username}, (err,foundUser)=>{

        if(err){
            console.log(err)
        }else if (foundUser) {
            if(foundUser.password === pasword){

                res.render("secrets");
            }
        }

    })

});

app.listen(3000, ()=>{
    console.log("Server started at port 3000");
});