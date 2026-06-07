const mongoose = require('mongoose')

const showSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  showTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number
  }
})

const Show = mongoose.model('Show', showSchema)
module.exports = Show
