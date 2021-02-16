  
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    lastName: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    phone: {
        type: String,
        maxlength: 50
    },
    password: {
        type: String,
        minglength: 5
    },
    role: {
        type: Number,
        default: 1
    }

})

const User = mongoose.model('User', userSchema);

module.exports = { User }