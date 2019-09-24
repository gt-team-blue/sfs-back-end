const express = require("express");
const router = express.Router();
// Load Story model
const Story = require("../../models/Story");

router.get('/story', (req, res) => {
    Story.find({}).pretty().then(function(stories){
        console.log("About to send");
        res.send(stories);
    });
});


/*
*This method will return all tags used on stores.
*Intent is to use this method with filtering.
*Example GET request: http://localhost:5000/api/stories/tags
*Equivalent Query: db.getCollection('stories').distinct("tags")
*/
router.get('/tags', (req, res) => {
    Story.distinct("tags").then(function(stories){
        console.log("About to send");
        res.send(stories);
    });
});

/*
db.getCollection('stories').find({
    $or:[{
        tags: "Easy"},
   {tags: "Intermediate"}
   ]})
   */
router.get('/storiesWithTags', (req, res) => {
    console.log(req.body);
    console.log("The tags are: " + req.body.tags.length);
    console.log("The tags are: " + req.body.tags[0]);
    console.log("The tags are: " + req.body.tags[1]);
    var tags = "{";
    for (var i = 0; i< req.body.tags.length; i++) {
        tags += "tags: \"" + req.body.tags[i] + "\"}";
        if (i < req.body.tags.length - 1) {
            tags += ",{";
        }
    }
    console.log(tags);
    Story.find({
    $or:[
        {tags: "Easy"},{tags: "Environment"}
       ]

    }).then(function(stories){
        console.log("About to send");
        res.send(stories);
    });
});

module.exports = router;
