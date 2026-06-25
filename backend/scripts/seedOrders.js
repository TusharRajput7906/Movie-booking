require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

const User = require('../models/User')
const Show = require('../models/Show')
const Seat = require('../models/Seat')
const Order = require('../models/Order')

function getRandomString(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

async function seedOrders() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB.')

    // Fetch existing shows
    const shows = await Show.find({}, '_id')
    if (shows.length === 0) {
      console.error('Error: No shows found in the database. Please create at least one show first via the admin panel.')
      process.exit(1)
    }

    // Fetch existing seats
    const seats = await Seat.find({}, '_id showId')
    if (seats.length === 0) {
      console.error('Error: No seats found in the database. Please create at least one show (which populates seats) first.')
      process.exit(1)
    }

    // Group seats by showId to select realistic seat combinations for orders
    const seatsByShow = {}
    for (const seat of seats) {
      const showIdStr = seat.showId.toString()
      if (!seatsByShow[showIdStr]) {
        seatsByShow[showIdStr] = []
      }
      seatsByShow[showIdStr].push(seat._id)
    }

    // Fetch existing user(s) to assign random user if possible
    const users = await User.find({}, '_id')
    const userIds = users.map(u => u._id)

    const TOTAL_ORDERS = 50000
    const BATCH_SIZE = 5000
    let ordersInserted = 0

    console.log(`Starting to seed ${TOTAL_ORDERS} orders...`)

    let batch = []
    for (let i = 1; i <= TOTAL_ORDERS; i++) {
      // Pick random show
      const randomShow = shows[Math.floor(Math.random() * shows.length)]
      const showId = randomShow._id
      const showIdStr = showId.toString()

      // Pick user
      const userId = userIds.length > 0 
        ? userIds[Math.floor(Math.random() * userIds.length)]
        : new mongoose.Types.ObjectId()

      // Pick 1 to 3 random seat ids for this show (fallback to any random seat if show group is empty)
      const seatPool = seatsByShow[showIdStr] || seats.map(s => s._id)
      const numSeats = Math.floor(Math.random() * 3) + 1 // 1, 2, or 3 seats
      const seatIds = []
      for (let sIdx = 0; sIdx < numSeats; sIdx++) {
        const randomSeat = seatPool[Math.floor(Math.random() * seatPool.length)]
        seatIds.push(randomSeat)
      }

      // Pick amount
      const amount = Math.floor(Math.random() * (500 - 150 + 1)) + 150

      // Pick status distribution: 85% confirmed, 10% failed, 5% cancelled
      const statusRoll = Math.random()
      let status = 'confirmed'
      if (statusRoll < 0.05) {
        status = 'cancelled'
      } else if (statusRoll < 0.15) {
        status = 'failed'
      }

      const razorpayOrderId = 'order_test_' + getRandomString(12)
      const razorpayPaymentId = status === 'confirmed' ? 'pay_test_' + getRandomString(12) : null
      const idempotencyKey = uuidv4()

      // Spread creation date across last 90 days
      const daysAgo = Math.random() * 90
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      batch.push({
        userId,
        showId,
        seatIds,
        amount,
        status,
        razorpayOrderId,
        razorpayPaymentId,
        idempotencyKey,
        createdAt
      })

      if (batch.length === BATCH_SIZE) {
        await Order.insertMany(batch)
        ordersInserted += batch.length
        console.log(`Inserted batch ${ordersInserted / BATCH_SIZE} — ${ordersInserted} total orders so far`)
        batch = []
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await Order.insertMany(batch)
      ordersInserted += batch.length
      console.log(`Inserted final batch — ${ordersInserted} total orders so far`)
    }

    console.log('Done! 50000 test orders seeded for analytics testing.')
    await mongoose.disconnect()
    process.exit(0)

  } catch (error) {
    console.error('Seeding orders failed:', error)
    process.exit(1)
  }
}

seedOrders()
