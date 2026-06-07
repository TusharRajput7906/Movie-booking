const mongoose = require('mongoose')

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  totalSeats: {
    type: Number
  }
})

const Theater = mongoose.model('Theater', theaterSchema)
module.exports = Theater
