const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  
    postImage: {
        type: String,
        required: true,
        maxlength: 100
      
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    mask: {
        type: String,
        required: true,
        maxlength: 500
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const BlogPost = mongoose.model('BlogPost', postSchema);

module.exports = { BlogPost }