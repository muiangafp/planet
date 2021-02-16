  
const mongoose = require('mongoose');

const contactSchema = mongoose.Schema({
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
        required: true,
        trim: true,
    },
    subject: {
        type: String,
        required: true,
  
    },
    phone: {
        type: String,
        maxlength: 50,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    attended: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const Contact = mongoose.model('Contact', contactSchema);

module.exports = { Contact }