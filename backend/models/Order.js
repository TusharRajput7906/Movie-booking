const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show'
  },
  seatIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat'
  }],
  amount: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  idempotencyKey: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

const Order = mongoose.model('Order', orderSchema)
module.exports = Order
