const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getCookieOptions,
  requireAuth,
} = require('../middleware/auth');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]{7,24}$/;

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function validateRegistration(body) {
  const {
    fullName,
    email,
    studentId,
    password,
    confirmPassword,
    department,
    program,
    academicYear,
    phone,
  } = body || {};

  if (
    !isNonEmptyString(fullName, 120) ||
    !isNonEmptyString(email, 254) ||
    !emailPattern.test(email.trim()) ||
    !isNonEmptyString(studentId, 40) ||
    !isNonEmptyString(department, 120) ||
    !isNonEmptyString(program, 120) ||
    !isNonEmptyString(phone, 24) ||
    !phonePattern.test(phone.trim()) ||
    !Number.isInteger(Number(academicYear)) ||
    Number(academicYear) < 1 ||
    Number(academicYear) > 8 ||
    typeof password !== 'string' ||
    password !== confirmPassword ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return 'Enter valid registration details, ensure passwords match, and use a password of 8–72 bytes.';
  }
  return null;
}

router.post('/register', async (req, res, next) => {
  const validationError = validateRegistration(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const {
      fullName,
      email,
      studentId,
      password,
      department,
      program,
      academicYear,
      phone,
    } = req.body;

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim().toUpperCase(),
      password: await bcrypt.hash(password, 12),
      department: department.trim(),
      program: program.trim(),
      academicYear: Number(academicYear),
      phone: phone.trim(),
      role: 'student',
    });

    res.cookie(AUTH_COOKIE_NAME, createSessionToken(user), getCookieOptions());
    return res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email or student ID already exists' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { identifier, password, rememberMe = false } = req.body || {};
  if (
    typeof identifier !== 'string' ||
    !identifier.trim() ||
    typeof password !== 'string' ||
    !password ||
    typeof rememberMe !== 'boolean'
  ) {
    return res.status(400).json({ message: 'Enter your email or student ID and password' });
  }

  try {
    const normalizedIdentifier = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier.toLowerCase() },
        { studentId: normalizedIdentifier.toUpperCase() },
      ],
    }).select('+password');

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email/student ID or password' });
    }

    res.cookie(
      AUTH_COOKIE_NAME,
      createSessionToken(user, rememberMe),
      getCookieOptions(rememberMe),
    );
    return res.json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
  return res.json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req, res) => (
  res.json({ user: req.user.toJSON() })
));

module.exports = router;
