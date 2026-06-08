const cron = require('node-cron')
const Seat = require('../models/Seat')

// Schedule job to run every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    const result = await Seat.updateMany(
      {
        status: 'locked',
        lockedUntil: { $lt: new Date() }
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockedUntil: null
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log(`[Cron] Released ${result.modifiedCount} expired seat locks.`)
    }
  } catch (error) {
    console.error('[Cron] Error releasing expired seat locks:', error)
  }
})

console.log('[Cron] Expired seat release job scheduled (every 30 seconds).')
