const express = require('express')
const router = express.Router()
const Show = require('../models/Show')
const Theater = require('../models/Theater')
const Seat = require('../models/Seat')
const { protect, adminOnly } = require('../middleware/auth')

// POST / - Create a show (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { movieId, theaterId, showTime, price } = req.body

    if (!movieId || !theaterId || !showTime) {
      return res.status(400).json({ error: 'movieId, theaterId, and showTime are required' })
    }

    const theater = await Theater.findById(theaterId)
    if (!theater) {
      return res.status(404).json({ error: 'Theater not found' })
    }

    const show = await Show.create({
      movieId,
      theaterId,
      showTime,
      price
    })

    const seatsArray = []
    for (let i = 1; i <= theater.totalSeats; i++) {
      seatsArray.push({
        showId: show._id,
        seatNumber: 'A' + i,
        status: 'available'
      })
    }

    await Seat.insertMany(seatsArray)

    res.status(201).json({
      show,
      seatsCreated: theater.totalSeats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /:showId/seats - Get all seats for a show (Public route)
router.get('/:showId/seats', async (req, res) => {
  try {
    const seats = await Seat.find({ showId: req.params.showId })
    res.status(200).json(seats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
