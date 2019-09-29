//Taken from: https://blog.bitsrc.io/build-a-login-auth-app-with-mern-stack-part-1-c405048e3669

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const passport = require("passport");

const app = express();

// Bodyparser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

//allow cross origin requests
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => {
      console.log("MongoDB successfully connected")
      // Routes
      app.use("/api/users", require("./routes/api/users"));
      app.use("/api/stories", require("./routes/api/stories"));

      // Passport middleware
      app.use(passport.initialize());
      // Passport config
      require("./config/passport")(passport);
  })
  .catch(err => console.log(err));

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
app.listen(port, () => console.log('Server up and running on port ' + port + '!'));
