//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require("./config/passport")(passport)
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Website Created By Vaishnavi Mariyala";
const contactContent = "Contact at 6309118537";
const {ensureAuthenticated} = require("./config/auth.js")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
 secret : 'secret',
 resave : true,
 saveUninitialized : true
}));
//use flash




app.use(flash());
app.use((req,res,next)=> {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error  = req.flash('error');
next();
})

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://mvaishu:mern@cluster0.7xe68.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true,useUnifiedTopology: true});

const postSchema = {
  title: String,
  content: String,
  username:String,
  userid:String
};

const User = require("./models/user");


const Post = mongoose.model("Post", postSchema);

app.get("/",ensureAuthenticated,function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts,
      user:req.user
      });
  });
});

app.get("/compose",ensureAuthenticated, function(req, res){
  res.render("compose",{user:req.user});
});

app.post("/compose",ensureAuthenticated, function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    username:req.user.name,
    userid:req.user
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/posts/:postId",ensureAuthenticated,function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content,
      userofpost:post.username,
      useridofpost:post.userid,
      user:req.user
    });
  });

});

app.get("/about",ensureAuthenticated,function(req, res){
  res.render("about", {aboutContent: aboutContent,user:req.user});
});

app.get("/contact",ensureAuthenticated,function(req, res){
  res.render("contact", {contactContent: contactContent,user:req.user});
});


//register page
app.get('/login',(req,res)=>{
  res.render('login');
})

app.get('/register',(req,res)=>{
  res.render('register')
  })

  app.get('/profile/:profileID',ensureAuthenticated,(req,res)=>{
    const requestedProfileId = req.params.profileID;
    User.findOne({name: requestedProfileId}, function(err, user){
      res.render("profile", {
        user:user
      });
    });
})



  app.get('/profile',ensureAuthenticated,(req,res)=>{
    res.render('profile',{
      user:req.user
      })
})


//Register handle
app.post('/register',(req,res)=>{
  const {name,email, password, password2} = req.body;
  let errors = [];
  
  if(!name || !email || !password || !password2) {
      errors.push({msg : "Please fill in all fields"})
  }
  //check if match
  if(password !== password2) {
      errors.push({msg : "passwords dont match"});
  }
  
  //check if password is more than 6 characters
  if(password.length < 6 ) {
      errors.push({msg : 'password atleast 6 characters'})
  }
  if(errors.length > 0 ) {
  res.render('register', {
      errors : errors,
      name : name,
      email : email,
      password : password,
      password2 : password2})
   } else {
      //validation passed
     User.findOne({email : email}).exec((err,user)=>{
      console.log(user);   
      if(user) {
          errors.push({msg: 'email already registered'});
          res.render('register',{errors,name,email,password,password2})  
         } else {
          const newUser = new User({
              name : name,
              email : email,
              password : password
          });
  
          //hash password
          bcrypt.genSalt(10,(err,salt)=> 
          bcrypt.hash(newUser.password,salt,
              (err,hash)=> {
                  if(err) throw err;
                      //save pass to hash
                      newUser.password = hash;
                  //save user
                  newUser.save()
                  .then((value)=>{
                      console.log(value)
                      req.flash('success_msg','You have now registered!')
                  res.redirect('/login');
                  })
                  .catch(value=> console.log(value));
                    
              }));
           }
     })
  }
  });

app.post('/login',(req,res,next)=>{

  passport.authenticate('local',{
    successRedirect : '/',
    failureRedirect : '/login',
    failureFlash : true,
    })(req,res,next);

});

//logout
app.get('/logout',ensureAuthenticated,(req,res)=>{

  req.logout();
  req.flash('success_msg','Now logged out');
  res.redirect('/login');

});

let port = process.env.PORT;
if(port=="" || port==null)
{
  port=3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
