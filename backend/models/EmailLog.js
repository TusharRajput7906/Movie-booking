const mongoose = require('mongoose')

const emailLogSchema = new mongoose.Schema({
  bookingId: {
    type: String
  },
  toEmail: {
    type: String
  },
  error: {
    type: String
  },
  attempts: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const EmailLog = mongoose.model('EmailLog', emailLogSchema)
module.exports = EmailLog
