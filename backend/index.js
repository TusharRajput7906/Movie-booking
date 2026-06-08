const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' })
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err))

require('./models/User')
require('./models/Movie')
require('./models/Theater')
require('./models/Show')
require('./models/Seat')
require('./models/Order')
require('./models/EmailLog')

const movieRoutes = require('./routes/movies')
app.use('/api/movies', movieRoutes)

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

const showRoutes = require('./routes/shows')
const seatRoutes = require('./routes/seats')
const theaterRoutes = require('./routes/theaters')
app.use('/api/shows', showRoutes)
app.use('/api/seats', seatRoutes)
app.use('/api/theaters', theaterRoutes)

require('./cron/releaseSeat')

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})