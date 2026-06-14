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

// GET / - Get shows by movieId (Public route)
router.get('/', async (req, res) => {
  try {
    const { movieId } = req.query
    let shows
    if (movieId) {
      shows = await Show.find({ movieId }).populate('movieId').populate('theaterId')
    } else {
      shows = await Show.find({}).populate('movieId').populate('theaterId').sort({ showTime: 1 })
    }
    res.status(200).json(shows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /:id - Get a single show by ID (Public route)
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movieId')
      .populate('theaterId')
    if (!show) {
      return res.status(404).json({ error: 'Show not found' })
    }
    res.status(200).json(show)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /:showId - Delete a show and all associated seats (Admin only)
router.delete('/:showId', protect, adminOnly, async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.showId)
    if (!show) {
      return res.status(404).json({ error: 'Show not found' })
    }
    await Seat.deleteMany({ showId: req.params.showId })
    res.status(200).json({ message: 'Show and seats deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
