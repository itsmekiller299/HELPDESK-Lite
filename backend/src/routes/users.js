const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, all, get, run } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');
const { text } = require('../utils/validation');

const router = express.Router();

router.patch('/me', authenticate, async (req, res) => {
  await getDb();
  const { name, password } = req.body;
  if (name === undefined && password === undefined) {
    return res.status(400).json({ error: 'Provide a name or password to update' });
  }
  if (name !== undefined) {
    const nameError = text(name, 'Name', { min: 2, max: 80 });
    if (nameError) return res.status(400).json({ error: nameError });
  }
  if (password !== undefined) {
    const passwordError = text(password, 'Password', { min: 8, max: 128 });
    if (passwordError) return res.status(400).json({ error: passwordError });
  }
  const current = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!current) return res.status(404).json({ error: 'User not found' });
  const updatedName = name === undefined ? current.name : name.trim();
  const updatedPassword = password === undefined ? current.password : bcrypt.hashSync(password, 10);
  await run('UPDATE users SET name = ?, password = ? WHERE id = ?', [updatedName, updatedPassword, req.user.id]);
  const user = await get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

router.get('/', authenticate, requireRole('Admin', 'Agent'), async (req, res) => {
  await getDb();
  const users = await all('SELECT id, name, email, role FROM users ORDER BY name');
  res.json(users);
});

router.get('/agents', authenticate, requireRole('Admin', 'Agent'), async (req, res) => {
  await getDb();
  const agents = await all("SELECT id, name, email, skills FROM users WHERE role IN ('Agent','Admin') AND is_bot = 0 ORDER BY name");
  res.json(agents);
});

module.exports = router;
