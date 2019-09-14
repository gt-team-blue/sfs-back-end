const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const StorySchema = new Schema({
  title: {
    type: String,
    required: true
  },
  creator: {
    type: String,
    required: true
  },
  storyPointer: {
    type: String,
    required: true
  },
  coverImagePointer: {
    type: String,
    default: String
  },
  editAccess: {
    type: Array,
    default: Array
  },
  tags: {
    type: Array,
    default: Array
  },
  creationDate: {
    type: Date,
    default: Date.now
  }
});
module.exports = Story = mongoose.model("stories", StorySchema);