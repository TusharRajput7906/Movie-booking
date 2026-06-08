require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env')
      process.exit(1)
    }

    const adminExists = await User.findOne({ email: adminEmail })

    if (adminExists) {
      console.log(`Admin user with email ${adminEmail} already exists.`)
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin'
        await adminExists.save()
        console.log(`Updated role to 'admin' for ${adminEmail}`)
      }
    } else {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      })
      console.log('Admin user created successfully')
    }

    // Demote other admins to maintain single admin status in sync with .env
    const demoteResult = await User.updateMany(
      { email: { $ne: adminEmail }, role: 'admin' },
      { role: 'user' }
    )
    if (demoteResult.modifiedCount > 0) {
      console.log(`Demoted ${demoteResult.modifiedCount} other admin user(s) to 'user' role`)
    }

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

createAdmin()
