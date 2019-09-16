const express = require("express");
const router = express.Router();
// Load Story model
const Story = require("../../models/Story");

router.get('/story', (req, res) => {
    Story.find({}).then(function(stories){
        res.send(stories);
    });
});

module.exports = router;
