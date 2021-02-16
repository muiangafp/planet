  
const mongoose = require('mongoose');

const newsletterSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
        required: true
    },
    lastName: {
        type: String,
        maxlength: 50,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    }
})

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = { Newsletter }