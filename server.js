//Taken from: https://blog.bitsrc.io/build-a-login-auth-app-with-mern-stack-part-1-c405048e3669

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const passport = require("passport");
const users = require("./routes/api/users");
const stories = require("./routes/api/stories");

const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => {
      console.log("MongoDB successfully connected")
      initGridFS()
  })
  .catch(err => console.log(err));

let multer = require('multer')
let GridFsStorage = require('multer-gridfs-storage')
let Grid = require('gridfs-stream')
Grid.mongo = mongoose.mongo
var gfs = null
var storage = null
var upload = null

// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);
// Routes
app.use("/api/users", users);
app.use("/api/stories", stories);

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
app.listen(port, () => console.log('Server up and running on port ' + port + '!'));

function initGridFS() {
    // PDF file management
    gfs = Grid(mongoose.connection.db)

    storage = GridFsStorage({
        gfs: gfs,
        db: mongoose.connection.db,
        filename: (req, file, cb) => {
            let date = Date.now()
            cb(null, file.fieldname + '-' + date + '.')
        },
        metadata: function(req, file, cb) {
            cb(null, {originalname: file.originalname})
        },
        root: 'ctFiles'
    })
    upload = multer({
        storage: storage
    }).single('file')

    app.post('/upload', (req, res) => {
        upload(req, res, (err) => {
            if(err) {
                res.json({error_code: 1, err_desc: err})
                return
            }
            res.json({error_code: 0, err_desc: null, file_uploaded: true})
        })
    })

    app.get('/file/:filename', (req, res) => {
        gfs.collection('ctFiles')
        gfs.files.find({filename: req.params.filename}).toArray(function(err, files) {
            if(!files || files.length == 0) {
                return res.status(404).json({
                    responseCode: 1,
                    reponseMessage: "error"
                })
                var readstream = gfs.createReadStream({
                    filename: files[0].filename,
                    root: "ctFiles"
                })
                res.set('Content-Type', files[0].contentType)
                return readstream.pipe(res)
            }
        })
    })

    app.delete('/file/:filename', (req, res) => {
        gfs.remove({filename: req.params.filename}, (err) => {
            if (err) return res.status(500).json({success: false})
            return res.json({success: true})
        })
    })

    console.log('Initialized GridFS successfully!')
}
