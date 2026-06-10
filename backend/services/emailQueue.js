const nodemailer = require('nodemailer')
const ejs = require('ejs')
const path = require('path')
const EmailLog = require('../models/EmailLog')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})

async function sendEmailWithRetry(to, templateData, attempts = 0) {
  try {
    const templatePath = path.join(__dirname, '../templates/booking-confirmation.ejs')
    const html = await ejs.renderFile(templatePath, templateData)

    await transporter.sendMail({
      from: `"MovieBooking" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your Booking is Confirmed!',
      html
    })

    console.log(`[Email] Successfully sent to ${to}`)

  } catch (err) {
    console.log(`[Email] Attempt ${attempts + 1} failed: ${err.message}`)

    if (attempts < 2) {
      const delay = Math.pow(3, attempts) * 1000
      console.log(`[Email] Retrying in ${delay / 1000} seconds...`)
      setTimeout(() => sendEmailWithRetry(to, templateData, attempts + 1), delay)
    } else {
      console.log(`[Email] All 3 attempts failed. Logging to database.`)
      try {
        await EmailLog.create({
          bookingId: templateData.bookingId,
          toEmail: to,
          error: err.message,
          attempts: attempts + 1
        })
      } catch (logErr) {
        console.log(`[Email] Could not save to EmailLog: ${logErr.message}`)
      }
    }
  }
}

function addToEmailQueue(to, templateData) {
  console.log(`[Email] Queued email for ${to}`)
  setImmediate(() => sendEmailWithRetry(to, templateData))
}

module.exports = { addToEmailQueue }