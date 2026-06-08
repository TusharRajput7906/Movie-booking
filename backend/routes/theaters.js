const express = require('express')
const router = express.Router()
const Theater = require('../models/Theater')
const { protect, adminOnly } = require('../middleware/auth')

// POST / - Create a theater (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, address, city, totalSeats } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Theater name is required' })
    }

    const theater = await Theater.create({
      name,
      address,
      city,
      totalSeats
    })

    res.status(201).json(theater)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET / - Get all theaters
router.get('/', async (req, res) => {
  try {
    const theaters = await Theater.find()
    res.status(200).json(theaters)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
