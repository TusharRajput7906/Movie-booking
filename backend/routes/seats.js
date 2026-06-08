const express = require('express')
const router = express.Router()
const Seat = require('../models/Seat')
const { protect } = require('../middleware/auth')

// POST /reserve - Reserve a seat (Protected)
router.post('/reserve', protect, async (req, res) => {
  try {
    const { seatId } = req.body

    if (!seatId) {
      return res.status(400).json({ error: 'seatId is required' })
    }

    const lockedUntil = new Date(Date.now() + 2 * 60 * 1000)

    const seat = await Seat.findOneAndUpdate(
      { _id: seatId, status: 'available' },
      { $set: { status: 'locked', lockedBy: req.user._id, lockedUntil } },
      { new: true }
    )

    if (!seat) {
      return res.status(409).json({
        error: 'Sorry, this seat was just taken by someone else. Please select a different seat.'
      })
    }

    res.status(200).json({
      seat,
      lockedUntil,
      message: 'Seat reserved for 2 minutes. Complete payment now.'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /release - Release a seat (Protected)
router.post('/release', protect, async (req, res) => {
  try {
    const { seatId } = req.body

    if (!seatId) {
      return res.status(400).json({ error: 'seatId is required' })
    }

    const seat = await Seat.findOneAndUpdate(
      { _id: seatId, lockedBy: req.user._id },
      { $set: { status: 'available', lockedBy: null, lockedUntil: null } },
      { new: true }
    )

    if (!seat) {
      return res.status(400).json({ error: 'Seat not found, not reserved by you, or already released.' })
    }

    res.status(200).json({ message: 'Seat released' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
