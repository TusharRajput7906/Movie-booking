const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Seat = require('../models/Seat')
const Movie = require('../models/Movie')
const EmailLog = require('../models/EmailLog')
const { protect, adminOnly } = require('../middleware/auth')

// Simple in-memory cache — no Redis needed
const cache = {}

function getCache(key) {
  const item = cache[key]
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    delete cache[key]
    return null
  }
  return item.data
}

function setCache(key, data, ttlSeconds) {
  cache[key] = {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  }
}

// All admin routes require login + admin role
router.use(protect, adminOnly)

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const cached = getCache('admin:stats')
    if (cached) return res.json(cached)

    const [totalBookings, revenueResult, failedPayments, seatsBooked] = await Promise.all([
      Order.countDocuments({ status: 'confirmed' }),
      Order.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.countDocuments({ status: 'failed' }),
      Seat.countDocuments({ status: 'booked' })
    ])

    const data = {
      totalBookings,
      totalRevenue: revenueResult[0]?.total || 0,
      failedPayments,
      seatsBooked
    }

    setCache('admin:stats', data, 60)
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/revenue?period=daily
router.get('/revenue', async (req, res) => {
  try {
    const period = req.query.period || 'daily'
    const cacheKey = 'admin:revenue:' + period
    const cached = getCache(cacheKey)
    if (cached) return res.json(cached)

    const format = period === 'monthly' ? '%Y-%m'
                 : period === 'weekly'  ? '%Y-%U'
                 : '%Y-%m-%d'

    const data = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    setCache(cacheKey, data, 300)
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/top-movies
router.get('/top-movies', async (req, res) => {
  try {
    const cached = getCache('admin:topmovies')
    if (cached) return res.json(cached)

    const data = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$showId', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'shows',
          localField: '_id',
          foreignField: '_id',
          as: 'show'
        }
      },
      { $unwind: { path: '$show', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie'
        }
      },
     { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookings: 1,
          movieTitle: { $ifNull: ['$movie.title', 'Unknown Movie'] }
        }
      }
    ])

    setCache('admin:topmovies', data, 300)
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/peak-hours
router.get('/peak-hours', async (req, res) => {
  try {
    const cached = getCache('admin:peakhours')
    if (cached) return res.json(cached)

    const data = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { hour: '$_id', bookings: 1, _id: 0 } }
    ])

    setCache('admin:peakhours', data, 300)
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/cancellations
router.get('/cancellations', async (req, res) => {
  try {
    const cached = getCache('admin:cancellations')
    if (cached) return res.json(cached)

    const [confirmed, failed] = await Promise.all([
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'failed' })
    ])

    const total = confirmed + failed
    const data = {
      confirmed,
      failed,
      cancellationRate: total > 0 ? ((failed / total) * 100).toFixed(2) + '%' : '0%'
    }

    setCache('admin:cancellations', data, 300)
    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router