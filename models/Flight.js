const mongoose = require('mongoose');

const flightSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    flightImage: {
        type: String,
      
    },
    title: {
        type: String,
        maxlength: 200
    },
    departurePlace: {
        type: String,
        maxlength: 100
    },
    arrivelPlace: {
        type: String,
        maxlength: 100
    },
    departureDate: {
        type: String,
        maxlength: 100
    },
    arrivelDate: {
        type: String,
        maxlength: 100
    },
    departureTime:{
        type: String,
        required: true,
        maxlength: 100
    },
    arrivelTime:{
        type: String,
        required: true,
        maxlength: 100
    },
    airline: {
        type: String,
        maxlength: 100
    },
    flightTime: {
        type: String,
        maxlength: 100
    },
    price: {
        type: String,
        maxlength: 100
    },
    type: {
        type: String,
        maxlength: 100
    },
    stops: {
        type: String,
        maxlength: 100
    },
    classe: {
        type: String,
        maxlength: 100
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const Flight = mongoose.model('Flight', flightSchema);

module.exports = { Flight }


