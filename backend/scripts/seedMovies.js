require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const axios = require('axios')
const Movie = require('../models/Movie')

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

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

async function fetchPage(page) {
  const res = await axios.get('https://api.themoviedb.org/3/movie/popular', {
    params: {
      api_key: process.env.TMDB_API_KEY,
      language: 'en-US',
      page
    }
  })
  return res.data.results
}

async function seed() {
  try {
    await Movie.deleteMany({})
    console.log('Old movies cleared')

    let allMovies = []

    for (let page = 1; page <= 250; page++) {
      try {
        const results = await fetchPage(page)
        const formatted = results.map(m => ({
          title: m.title,
          genre: m.genre_ids.map(id => genreMap[id]).filter(g => g !== undefined),
          language: languageMap[m.original_language] || 'Other',
          description: m.overview || 'No description available',
          poster: m.poster_path ? 'https://image.tmdb.org/t/p/w500' + m.poster_path : null,
          rating: m.vote_average || 0,
          trailer_url: null
        }))

        allMovies.push(...formatted)
        console.log('Fetched page ' + page + '/250 — movies so far: ' + allMovies.length)
      } catch (err) {
        console.log('Page ' + page + ' failed: ' + err.message)
      }
      await new Promise(r => setTimeout(r, 250))
    }

    if (allMovies.length > 0) {
      await Movie.insertMany(allMovies)
      console.log('Seeding complete! Total movies saved: ' + allMovies.length)
    } else {
      console.log('No movies were fetched. Check your TMDB_API_KEY or connection.')
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Seeding encountered an error:', error)
    process.exit(1)
  }
}

seed()
