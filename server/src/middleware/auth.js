const jwt = require('jsonwebtoken');
const User = require('../models/User');

const AUTH_COOKIE_NAME = 'campus_connect_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    Buffer.byteLength(secret) < 32 ||
    /replace-with|change-me|your-secret/i.test(secret)
  ) {
    throw new Error('Set JWT_SECRET to a unique random value of at least 32 characters');
  }
  return secret;
}

function getCookieOptions(rememberMe = false) {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['strict', 'lax', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
  }
  const secure = process.env.NODE_ENV === 'production' || sameSite === 'none';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
  };
}

function createSessionToken(user, rememberMe = false) {
  return jwt.sign(
    { sub: user.id },
    getJwtSecret(),
    { expiresIn: rememberMe ? '7d' : '12h' },
  );
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getCookieOptions,
  getJwtSecret,
  requireAuth,
  requireRole,
};
