require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const https = require('https')
const mongoose = require('mongoose')
const Movie = require('../models/Movie')

const TMDB_KEY = process.env.TMDB_API_KEY
const TOTAL_PAGES = 250

const genreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation',
  35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  53: 'Thriller', 10752: 'War', 37: 'Western'
}

const languageMap = {
  hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  ml: 'Malayalam', en: 'English', fr: 'French',
  es: 'Spanish', ko: 'Korean', ja: 'Japanese'
}

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=${page}`
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed.results || [])
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')

    await Movie.deleteMany({})
    console.log('Old movies cleared')

    let allMovies = []

    for (let page = 1; page <= TOTAL_PAGES; page++) {
      try {
        const results = await fetchPage(page)
        const formatted = results.map(m => ({
          title: m.title,
          genre: m.genre_ids.map(id => genreMap[id]).filter(g => g !== undefined),
          language: languageMap[m.original_language] || 'Other',
          description: m.overview || 'No description available',
          poster: m.poster_path
            ? 'https://image.tmdb.org/t/p/w500' + m.poster_path
            : null,
          rating: m.vote_average || 0,
          trailer_url: null
        }))

        allMovies = allMovies.concat(formatted)
        console.log(`Page ${page}/250 done — total movies so far: ${allMovies.length}`)
        await sleep(250)

      } catch (err) {
        console.log(`Page ${page} failed: ${err.message} — skipping`)
      }
    }

    await Movie.insertMany(allMovies)
    console.log(`Seeding complete! Total movies saved: ${allMovies.length}`)

    mongoose.disconnect()
    process.exit()

  } catch (err) {
    console.log('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()