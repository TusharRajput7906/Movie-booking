const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  genre: {
    type: [String],
    index: true
  },
  language: {
    type: String,
    index: true
  },
  description: {
    type: String
  },
  trailer_url: {
    type: String
  },
  poster: {
    type: String
  },
  rating: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Movie = mongoose.model('Movie', movieSchema)
module.exports = Movie
