const express = require('express');
const { getDb, run, get, all } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');
const { text } = require('../utils/validation');
const { sendTicketEmail } = require('../services/email');

const router = express.Router();

router.get('/:ticketId', authenticate, async (req, res) => {
  await getDb();
  const ticket = await get('SELECT * FROM tickets WHERE id = ?', [req.params.ticketId]);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role === 'Customer' && ticket.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  let comments;
  if (req.user.role === 'Customer') {
    comments = await all(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ? AND c.is_internal = 0
      ORDER BY c.created_at ASC
    `, [req.params.ticketId]);
  } else {
    comments = await all(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `, [req.params.ticketId]);
  }

  res.json(comments);
});

router.post('/:ticketId', authenticate, async (req, res) => {
  await getDb();
  const { content, is_internal, attachment } = req.body;

  const contentError = text(content, 'Comment content', { min: 1, max: 5000 });
  if (contentError) {
    return res.status(400).json({ error: contentError });
  }

  const ticket = await get('SELECT * FROM tickets WHERE id = ?', [req.params.ticketId]);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role === 'Customer' && ticket.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (is_internal && req.user.role === 'Customer') {
    return res.status(403).json({ error: 'Customers cannot create internal notes' });
  }

  if (is_internal !== undefined && typeof is_internal !== 'boolean') {
    return res.status(400).json({ error: 'is_internal must be true or false' });
  }
  let attachmentName = null;
  let attachmentType = null;
  let attachmentData = null;
  if (attachment !== undefined) {
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!attachment || typeof attachment !== 'object' || typeof attachment.name !== 'string' || typeof attachment.type !== 'string' || typeof attachment.data !== 'string') {
      return res.status(400).json({ error: 'Attachment is invalid' });
    }
    if (!allowedTypes.includes(attachment.type) || attachment.name.length > 120 || attachment.data.length > 900000) {
      return res.status(400).json({ error: 'Attachment must be a PNG, JPEG, PDF, or text file smaller than 650 KB' });
    }
    attachmentName = attachment.name;
    attachmentType = attachment.type;
    attachmentData = attachment.data;
  }
  const internal = is_internal && req.user.role !== 'Customer' ? 1 : 0;
  const result = await run('INSERT INTO comments (ticket_id, user_id, content, is_internal, attachment_name, attachment_type, attachment_data) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.params.ticketId, req.user.id, content.trim(), internal, attachmentName, attachmentType, attachmentData]);

  await run('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.ticketId]);

  const comment = await get(`
    SELECT c.*, u.name as user_name, u.role as user_role
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `, [result.lastId]);

  const recipients = await all(
    'SELECT id, name, email FROM users WHERE id IN (?, ?) AND id != ?',
    [ticket.customer_id, ticket.assigned_to || ticket.customer_id, req.user.id],
  );
  for (const recipient of recipients) {
    await run('INSERT INTO notifications (user_id, message, ticket_id) VALUES (?, ?, ?)', [recipient.id, `New reply on ticket #${ticket.id}: ${ticket.subject}`, ticket.id]);
    // Internal notes are never sent outside the staff team.
    if (!internal || recipient.id !== ticket.customer_id) {
      void sendTicketEmail({
        to: recipient.email,
        recipientName: recipient.name,
        ticket,
        subject: `New reply on ticket #${ticket.id}`,
        preview: `${req.user.name} replied: ${content.trim().slice(0, 240)}`,
      });
    }
  }

  res.status(201).json(comment);
});

module.exports = router;
