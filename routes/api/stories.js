const express = require("express");
const router = express.Router();
// Load Story model
const Story = require("../../models/Story");
// Story model validation
const validateStoryInput = require("../../validation/story");
// GridFS handling
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const {mongo, connection} = require('mongoose');
Grid.mongo = mongo
var gfs = Grid(connection.db)

var storage = GridFsStorage({
    db: connection.db,
    file: (req, file) => {
        return {
            filename: file.originalname
        }
    }
})
var upload = multer({storage: storage}).single('file')

/*
 * Uploads a story PDF to GridFS. The storyId to a Story object is passed in as
 * form data. Once the PDF is uploaded, the Story's storyPointer is updated with
 * the uploaded file's _id. This will also delete an existing story PDF if
 * storyPointer is not null.
 */
router.post('/upload/:storyId', upload, (req, res) => {
    if (req.params.storyId == null) {
        res.status(400).json({success: false, data: "No storyId provided"});
        return;
    }
    // make sure the file actually exists
    if (req.file == null) {
        res.status(400).json({success: false, data: "No story file provided"});
        return;
    }
    // find the story object associated with the provided storyId
    Story.findOne({_id: req.params.storyId},(err, story) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else if (story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            // now upload the new file to gfs
            if(err) {
                res.json({success: false, data: err});
                return;
            }
            // remove the previous file if it exists
            if (story.storyPointer != null) {
                gfs.remove({_id: story.storyPointer}, (err) => {
                    if (err) console.log(err)
                });
            }
            // log story info
            console.log("Story uploaded:");
            console.log(req.file);
            // update story pointer
            story.storyPointer = req.file.id;
            story.save().catch(err => console.log(err));
            res.json({success: true});
        }
    });
});

/*
 * Endpoint to download a story PDF. The provided storyId is given as a
 * parameter and references a Story object, which contains the pointer to the
 * PDF within GridFS. A read stream is created to this file and returned to the
 * client.
 */
router.get('/download/:storyId', (req, res) => {
    Story.findOne({_id: req.params.storyId},(err, story) => {
        if (err != null) {
            console.log(err);
            res.status(400).json({success: false, data: err});
        } else if (story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            gfs.files.find({_id: story.storyPointer}).toArray(function(err, files) {
                if(!files || files.length == 0) {
                    return res.status(404).json({success: false, data: "error"});
                }
                var readstream = gfs.createReadStream({
                    filename: files[0].filename
                });
                res.set('Content-Type', files[0].contentType);
                return readstream.pipe(res);
            });
        }
    });
});

/*
 * Simple endpoint to retrieve a JSON listing of all files in the GridFS
 * storage. This shouldn't be used by the client, only for testing purposes.
 */
router.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0){
            return res.status(404).json({error: "Could not find files"});
        }
        return res.json(files);
    });
});

/*
 * Endpoint to completely delete a story. The ID of a Story object is provided
 * (storyId) - this will first delete the PDF associated with the Story (if it
 * exists) and then delete the Story object itself.
 */
router.delete('/:storyId', (req, res) => {
    Story.findOne({_id: req.params.storyId},(err, story) => {
        if (err != null) {
            console.log(err);
            res.status(400).json({success: false, data: err});
        } else if (story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            var error = null
            // remove the PDF from gfs
            if (story.storyPointer != null) {
                gfs.remove({_id: story.storyPointer}, (err) => {
                    error = err
                });
            }
            // remove the Story object
            story.delete()
            if (error) return res.status(500).json({success: false, data: error});
            return res.json({success: true});
        }
    });
});

/*
 * Creates a new Story object from a provided title and creator. This will
 * return the data associated with the newly created Story (including the id).
 * This should *immediately* be proceeded with a '/upload' call using the
 * returned storyId.
 */
router.post('/create', (req, res) => {
    const { errors, isValid } = validateStoryInput(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const newStory = new Story();
    newStory.title = req.body.title;
    newStory.creator = req.body.creatorEmail;
    newStory.editAccess.push(req.body.creatorEmail);
    newStory.save()
        .then(story => res.json(story))
        .catch(err => console.log(err));
});

/*
* This method will get all stories in database.
* Example GET request: http://localhost:5000/api/stories/stories
* Equivalent Query: db.getCollection('stories').find({});

Example Return Packet
{
    "success": true/false   //Whether query succeeded
    "data": [               //Story Metadata
        {
            "editAccess": [
                "sszczepaniuk",
                "magrawal"
            ],
            "tags": [
                "Environmental",
                "Intermediate"
            ],
            "_id": "5d7a734f1c9d440000832b37",
            "title": "Story 1",
            "creator": "sszczepaniuk",
            "storyPointer": null,
            "coverImagePointer": null,
            "creationDate": "2019-09-04T18:41:15.459Z"
        }
    ]
}
*/

router.get('/stories', (req, res) => {
    Story.find({}, (err, stories) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else {
            res.status(200).json({success: true, data: stories});
        }
    });
});

router.post('/add_edit_access', (req, res) => {
    if(req.body.storyId == null) {
        res.status(400).json({success: false, data: "No story ID provided"});
        return;
    }
    if (req.body.email == null) {
        res.status(400).json({success: false, data: "No email provided"});
        return;
    }
    Story.findOne({_id: req.body.storyId}, (err, story) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else if(story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            if (!story.editAccess.includes(req.body.email)) {
                story.editAccess.push(req.body.email);
                story.save();
                res.status(200).json({success: true})
            } else {
                res.status(400).json({success: false, data: "User already has edit access"});
            }
        }
    });
});

router.post('/remove_edit_access', (req, res) => {
    if(req.body.storyId == null) {
        res.status(400).json({success: false, data: "No story ID provided"});
        return;
    }
    if (req.body.email == null) {
        res.status(400).json({success: false, data: "No email provided"});
        return;
    }
    Story.findOne({_id: req.body.storyId}, (err, story) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else if(story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            let index = story.editAccess.indexOf(req.body.email);
            if (index !== -1) {
                story.editAccess.splice(index, 1);
                story.save();
                res.status(200).json({success: true})
            } else {
                res.status(400).json({success: false, data: "User doesn't have edit access"});
            }
        }
    });
});


/*
*   This method will return all tags used on stories.
*   Intent is to use this method with filtering.

*   Example GET request: http://localhost:5000/api/stories/tags
*   Equivalent Query: db.getCollection('stories').distinct("tags")

*   Returns array of tags
*   {
*       "success": true/false   //Whether query succeeded
        "data": [               //Tag Array
            "Easy",
            "Politics"
        ]
    }
*/
router.get('/tags', (req, res) => {
    Story.distinct("tags", (err, tags) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else {
            res.status(200).json({success: true, data: tags});
        }
    });
});

router.post('/add_tag', (req, res) => {
    if(req.body.storyId == null) {
        res.status(400).json({success: false, data: "No story ID provided"});
        return;
    }
    if (req.body.tag == null) {
        res.status(400).json({success: false, data: "No tag provided"});
        return;
    }
    Story.findOne({_id: req.body.storyId}, (err, story) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else if(story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            if (!story.tags.includes(req.body.ttag)) {
                story.tags.push(req.body.tag);
                story.save();
                res.status(200).json({success: true})
            } else {
                res.status(400).json({success: false, data: "Story already has provided tag"});
            }
        }
    });
});

router.post('/remove_tag', (req, res) => {
    if(req.body.storyId == null) {
        res.status(400).json({success: false, data: "No story ID provided"});
        return;
    }
    if (req.body.tag == null) {
        res.status(400).json({success: false, data: "No tag provided"});
        return;
    }
    Story.findOne({_id: req.body.storyId}, (err, story) => {
        if (err != null) {
            console.log(err);
            res.status(500).json({success: false, data: err});
        } else if(story == null) {
            res.status(400).json({success: false, data: "Story with that id not found"});
        } else {
            let index = story.tags.indexOf(req.body.tag);
            if (index !== -1) {
                story.tags.splice(index, 1);
                story.save();
                res.status(200).json({success: true})
            } else {
                res.status(400).json({success: false, data: "Story doesn't have provided tag"});
            }
        }
    });
});

/*
*This method will return all stories tagged with provided tags
*Intent is to use this method with filtering.

*Example GET request: http://localhost:5000/api/stories/storiesWithTags
*Example Body:
*   tags: Easy
*   tags: Envionmental

Example Return Packet
{
    "success": true/false   //Whether query succeeded
    "data": [               //Story Metadata
        {
            "editAccess": [
                "sszczepaniuk",
                "magrawal"
            ],
            "tags": [
                "Environmental",
                "Intermediate"
            ],
            "_id": "5d7a734f1c9d440000832b37",
            "title": "Story 1",
            "creator": "sszczepaniuk",
            "storyPointer": null,
            "coverImagePointer": null,
            "creationDate": "2019-09-04T18:41:15.459Z"
        }
    ]
}
*/
router.post('/storiesWithTags', (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        Story.find({}, (err, stories) => {
            if (err != null) {
                console.log(err);
                res.status(500).json({success: false, data: err})
            }
            res.status(200).json({success: true, data: stories});
        });
    } else if (req.body.tags.length > 0){
        Story.find({tags: {$in: req.body.tags}},(err, stories) => {
            if (err != null) {
                console.log(err);
                res.status(500).json({success: false, data: err})
            }
            res.status(200).json({success: true, data: stories});
        });
    } else {
        res.status(400).json({success: false, data: "Error with length of tags input"});
    }
});

/*
This method will return the story specified by an ID

Example GET request: http://localhost:5000/api/stories/storyFromId
Example Body:
   id: 5d7a734f1c9d440000832b37

Returns array of story metadata
Example Return Packet
{
    "success": true/false   //Whether query succeeded
    "data": [               //Story Metadata
        {
            "editAccess": [
                "sszczepaniuk",
                "magrawal"
            ],
            "tags": [
                "Environmental",
                "Intermediate"
            ],
            "_id": "5d7a734f1c9d440000832b37",
            "title": "Story 1",
            "creator": "sszczepaniuk",
            "storyPointer": null,
            "coverImagePointer": null,
            "creationDate": "2019-09-04T18:41:15.459Z"
        }
    ]
}
*/
router.get('/storyFromId', (req, res) => {
    if (req.query.id != null) {
        Story.find({_id: req.query.id}, (err, stories) => {
            if (err != null) {
                console.log(err);
                res.status(500).json({success: false, data: err});
            } else if (stories.length == 0) {
                res.status(400).json({success: false, data: "Story with that id not found"});
            } else {
                res.status(200).json({success: true, data: stories});
            }
        });
    } else {
        res.status(400).json({success: false, data: "Please enter an id number"});
    }
})

router.get('/storiesByEditor', (req, res) => {
    if (req.query.userEmail != null) {
        Story.find({editAccess: req.query.userEmail}, (err, stories) => {
            if (err != null) {
                console.log(err);
                res.status(500).json({success: false, data: err});
            } else if (stories.length == 0) {
                res.status(400).json({success: false, data: "Story with that id not found"});
            } else {
                res.status(200).json({success: true, data: stories});
            }
        });
    } else {
        res.status(400).json({success: false, data: "Please enter a user email"})
    }
})

module.exports = router;
