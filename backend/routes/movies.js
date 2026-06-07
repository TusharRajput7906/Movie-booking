const express = require('express')
const router = express.Router()
const Movie = require('../models/Movie')
const { protect, adminOnly } = require('../middleware/auth')

function extractVideoId(url) {
  if (!url) return null
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// GET / route - Get all movies with filters, pagination, and aggregates
router.get('/', async (req, res) => {
  try {
    const { genre, language, page = '1', limit = '20', sort = 'title' } = req.query

    const filter = {}
    if (genre) {
      filter.genre = { $in: Array.isArray(genre) ? genre : [genre] }
    }
    if (language) {
      filter.language = language
    }

    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    const [movies, total, genreCounts, langCounts] = await Promise.all([
      Movie.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Movie.countDocuments(filter),
      Movie.aggregate([
        { $match: language ? { language: language } : {} },
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Movie.aggregate([
        { $match: genre ? { genre: { $in: Array.isArray(genre) ? genre : [genre] } } : {} },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    const moviesWithVideoId = movies.map(m => ({
      ...m,
      videoId: extractVideoId(m.trailer_url)
    }))

    res.json({
      movies: moviesWithVideoId,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      genreCounts,
      langCounts
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /:id route - Get a movie by ID
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).lean()
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' })
    }
    const videoId = extractVideoId(movie.trailer_url)
    res.json({
      ...movie,
      videoId
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST / route - Create a movie (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    let { title, genre, language, description, trailer_url, poster, rating } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    if (genre) {
      if (typeof genre === 'string') {
        genre = [genre]
      }
    }

    if (trailer_url) {
      const videoId = extractVideoId(trailer_url)
      if (videoId === null) {
        return res.status(400).json({
          error: 'Invalid YouTube URL. Use youtube.com/watch?v= or youtu.be/ format'
        })
      }
    }

    const movie = await Movie.create({
      title,
      genre,
      language,
      description,
      trailer_url,
      poster,
      rating
    })

    res.status(201).json({
      ...movie.toObject(),
      videoId: extractVideoId(trailer_url)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
