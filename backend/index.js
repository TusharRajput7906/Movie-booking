const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://movie-booking-frontend.vercel.app' 
]

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://movie-booking-theta-swart.vercel.app'
  ],
  credentials: true
}))
require('dotenv').config()

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

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
const paymentRoutes = require('./routes/payment')
app.use('/api/shows', showRoutes)
app.use('/api/seats', seatRoutes)
app.use('/api/theaters', theaterRoutes)
app.use('/api/payment', paymentRoutes)

const adminRoutes = require('./routes/admin')
app.use('/api/admin', adminRoutes)

require('./cron/releaseSeat')

app.get('/api/test-email', async (req, res) => {
  const { addToEmailQueue } = require('./services/emailQueue')
  addToEmailQueue(process.env.EMAIL_USER, {
    name: 'Tushar',
    bookingId: 'TEST123456',
    movieTitle: 'Inception',
    theaterName: 'PVR Cinemas Delhi',
    showTime: '25 Dec 2026 at 6:00 PM',
    seatNumbers: 'A1, A2',
    amount: 500,
    paymentId: 'pay_testABC123'
  })
  res.json({ message: 'Email queued! Check your inbox in 30 seconds.' })
})


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})