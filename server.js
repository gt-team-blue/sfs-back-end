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
