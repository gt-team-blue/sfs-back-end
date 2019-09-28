const express = require("express");
const router = express.Router();
// Load Story model
const Story = require("../../models/Story");

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
            res.status(400).json({success: false, data: err});
        } else {
            res.status(200).json({success: true, data: stories});
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
            res.status(400).json({success: false, data: err});
        } else {
            res.status(200).json({success: true, data: tags});
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
router.get('/storiesWithTags', (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        Story.find({}, (err, story) => {
            if (err != null) {
                console.log(err);
                res.status(400).json({success: false, data: err})
            }
            res.status(200).json({success: true, data: story});
        });
    } else if (req.body.tags.length > 0){
        Story.find({tags: {$in: req.body.tags}},(err, story) => {
            if (err != null) {
                console.log(err);
                res.status(400).json({success: false, data: err})
            }
            res.status(200).json({success: true, data: story});
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
    if (req.body.id != null){
        Story.find({_id: req.body.id},(err, story) => {
            if (err != null) {
                console.log(err);
                res.status(400).json({success: false, data: err});
            } else if (story.length == 0) {
                res.status(400).json({success: false, data: "Story with that id not found"});
            } else {
                res.status(200).json({success: true, data: story});
            }
        });
    } else {
        res.status(400).json({success: false, data: "Please enter an id number"});
    }
})

module.exports = router;
