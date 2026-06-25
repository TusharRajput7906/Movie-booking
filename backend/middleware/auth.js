const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const userId = decoded.id || decoded._id
      
      // Privilege Escalation Protection: Do NOT trust the role from the JWT payload.
      // A JWT issued when someone had the 'user' role remains valid for its full duration (e.g. 7 days).
      // If an admin revokes their admin status in the database, verifying only the JWT claims would allow
      // unauthorized admin access. By performing a fresh database lookup below on every request,
      // the very next API call will correctly reflect their demoted non-admin status.
      req.user = await User.findById(userId).select('-password')

      if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, user not found' })
      }

      return next()
    } catch (error) {
      console.error(error)
      return res.status(401).json({ error: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ error: 'Not authorized as an admin' })
  }
}

module.exports = { protect, adminOnly }
