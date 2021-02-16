  
const mongoose = require('mongoose');

const flightBookingSchema = mongoose.Schema({
    flightId: {type: String},
    flightTitle: {type: String},
    flightImage: {type: String},
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
    phone: {
        type: String,
        maxlength: 50,
        required: true
    },
    message: {
        type: String
       
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

const FlightBooking = mongoose.model('FlightBooking', flightBookingSchema);

module.exports = { FlightBooking }