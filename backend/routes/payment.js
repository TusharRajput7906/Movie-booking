const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const Razorpay = require('razorpay')
const { protect } = require('../middleware/auth')
const Order = require('../models/Order')
const Seat = require('../models/Seat')
const { v4: uuidv4 } = require('uuid')

// POST /create-order (protected — user must be logged in)
router.post('/create-order', protect, async (req, res) => {
  try {
    const { seatIds, showId, amount } = req.body

    if (!seatIds || !Array.isArray(seatIds) || !showId || !amount) {
      return res.status(400).json({ error: 'seatIds (array), showId, and amount are required' })
    }

    // Verify all seats are still locked by this user
    const seats = await Seat.find({
      _id: { $in: seatIds },
      lockedBy: req.user._id,
      status: 'locked'
    })

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'Some seats are no longer reserved. Please restart booking.' })
    }

    const idempotencyKey = uuidv4()

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const rzpOrder = await instance.orders.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: idempotencyKey
    })

    await Order.create({
      userId: req.user._id,
      showId,
      seatIds,
      amount,
      razorpayOrderId: rzpOrder.id,
      idempotencyKey,
      status: 'pending'
    })

    return res.status(200).json({
      orderId: rzpOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      currency: 'INR'
    })
  } catch (error) {
    console.error('Error in create-order:', error)
    return res.status(500).json({ error: error.message })
  }
})

// POST /verify (protected)
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required' })
    }

    // Check for duplicate
    const existing = await Order.findOne({ razorpayPaymentId: razorpay_payment_id })
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already processed', orderId: existing._id })
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Update order status to failed
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' },
        { new: true }
      )

      if (order) {
        // Release seats back to available
        await Seat.updateMany(
          { _id: { $in: order.seatIds } },
          { status: 'available', lockedBy: null, lockedUntil: null }
        )
      }

      return res.status(400).json({ error: 'Payment verification failed. Your seats have been released.' })
    }

    // Signature matches: confirm order
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'confirmed', razorpayPaymentId: razorpay_payment_id },
      { new: true }
    ).populate({
      path: 'showId',
      populate: [
        { path: 'movieId' },
        { path: 'theaterId' }
      ]
    }).populate('seatIds')

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Update seats to booked
    await Seat.updateMany(
      { _id: { $in: order.seatIds.map(s => s._id) } },
      { $set: { status: 'booked' } }
    )

    const seatIds = order.seatIds.map(s => s.seatNumber)
    const { addToEmailQueue } = require('../services/emailQueue')
addToEmailQueue(req.user.email, {
  name: req.user.name,
  bookingId: order._id,
  movieTitle: 'Your Movie',
  theaterName: 'Your Theater',
  showTime: 'Check your booking',
  seatNumbers: order.seatIds.join(', '),
  amount: order.amount,
  paymentId: razorpay_payment_id
})

    return res.status(200).json({
      success: true,
      orderId: order._id,
      message: 'Booking confirmed!'
    })
  } catch (error) {
    console.error('Error in verify payment:', error)
    return res.status(500).json({ error: error.message })
  }
})

// POST /webhook (no auth — this is called by Razorpay directly)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    if (!signature) {
      return res.status(400).json({ error: 'Webhook signature is required' })
    }

    // Verification body is the raw body string
    const bodyStr = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(bodyStr)
      .digest('hex')

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Webhook verification failed' })
    }

    const { event, payload } = req.body

    if (!payload || !payload.payment || !payload.payment.entity) {
      return res.status(200).json({ success: true, message: 'Ignored empty/unsupported payload' })
    }

    const paymentEntity = payload.payment.entity
    const razorpay_payment_id = paymentEntity.id
    const razorpay_order_id = paymentEntity.order_id

    if (event === 'payment.captured') {
      // Check for duplicate
      const existing = await Order.findOne({ razorpayPaymentId: razorpay_payment_id })
      if (existing) {
        return res.status(200).json({ success: true, message: 'Already processed' })
      }

      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'confirmed', razorpayPaymentId: razorpay_payment_id },
        { new: true }
      )

      if (order) {
        await Seat.updateMany(
          { _id: { $in: order.seatIds } },
          { $set: { status: 'booked' } }
        )
      }
    } else if (event === 'payment.failed') {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' },
        { new: true }
      )

      if (order) {
        await Seat.updateMany(
          { _id: { $in: order.seatIds } },
          { status: 'available', lockedBy: null, lockedUntil: null }
        )
      }
    }

    return res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error('Error in webhook:', error)
    return res.status(500).json({ error: error.message })
  }
})

module.exports = router
