const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, run, get } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { email: isEmail, text } = require('../utils/validation');

const router = express.Router();

router.post('/register', async (req, res) => {
  await getDb();
  const { name, email, password, role } = req.body;

  const nameError = text(name, 'Name', { min: 2, max: 80 });
  const passwordError = text(password, 'Password', { min: 8, max: 128 });
  if (nameError || passwordError || !email) {
    return res.status(400).json({ error: nameError || passwordError || 'Name, email, and password are required' });
  }
  if (!email || !email.trim() || !isEmail(email)) {
    return res.status(400).json({ error: 'Provide a valid email address' });
  }

  // Privileged accounts must be provisioned by an administrator, never by public signup.
  const userRole = process.env.ALLOW_PRIVILEGED_REGISTRATION === 'true' && ['Admin', 'Agent', 'Customer'].includes(role)
    ? role
    : 'Customer';

  const normalizedEmail = email.trim().toLowerCase();
  const existing = get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const normalizedName = name.trim();
  const result = run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [normalizedName, normalizedEmail, hashedPassword, userRole]);
  const userId = result.lastId;

  const token = jwt.sign({ id: userId, email: normalizedEmail, role: userRole, name: normalizedName }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.status(201).json({ token, user: { id: userId, name: normalizedName, email: normalizedEmail, role: userRole } });
});

router.post('/login', async (req, res) => {
  await getDb();
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', authenticate, async (req, res) => {
  await getDb();
  const user = get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = router;
