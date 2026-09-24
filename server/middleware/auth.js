const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authenticate: verifies the JWT and attaches the user to req.user.
 * Every admin-only route must ALSO pass through requireAdmin below —
 * role is checked server-side and is never trusted from the client.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub || payload.id || payload._id || payload.userId;
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid session.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
