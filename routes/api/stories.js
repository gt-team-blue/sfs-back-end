const express = require("express");
const router = express.Router();
// Load Story model
const Story = require("../../models/Story");

router.get('/story', (req, res) => {
    // res.send({type: 'GET'});
    Story.find({}).then(function(stories){
        res.send(stories);
    });
    // Story.find((err, data) => {
    //   if (err) return res.json({ success: false, error: err });
    //   return res.json({ success: true, data: data });
    // });
});

module.exports = router;