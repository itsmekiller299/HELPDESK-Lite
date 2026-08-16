const express = require('express');
const { getDb, all, run } = require('../db/schema');
const { authenticate } = require('../middleware/auth');
const { id } = require('../utils/validation');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  await getDb();
  const notifications = await all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', [req.user.id]);
  res.json(notifications);
});

router.patch('/:id/read', authenticate, async (req, res) => {
  await getDb();
  const notificationId = id(req.params.id);
  if (!notificationId) return res.status(400).json({ error: 'Invalid notification id' });
  await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, req.user.id]);
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
