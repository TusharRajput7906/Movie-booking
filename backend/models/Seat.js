const mongoose = require('mongoose')

const seatSchema = new mongoose.Schema({
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'locked', 'booked'],
    default: 'available'
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedUntil: {
    type: Date
  }
})

// Compound index: showId and seatNumber must be unique together
seatSchema.index({ showId: 1, seatNumber: 1 }, { unique: true })

// Index on status and lockedUntil
seatSchema.index({ status: 1, lockedUntil: 1 })

const Seat = mongoose.model('Seat', seatSchema)
module.exports = Seat
