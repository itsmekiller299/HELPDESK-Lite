const express = require('express');
const { getDb, run, get, all } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');
const { CATEGORIES, PRIORITIES, id, text } = require('../utils/validation');
const { sendTicketEmail } = require('../services/email');
const { autoRespondToTicket } = require('../services/auto-responder');
const { autoAssignTicket } = require('../services/auto-assign');
const { summarizeConversation } = require('../services/summary');

const router = express.Router();

const SLA_TARGETS = {
  Critical: 4,
  High: 8,
  Medium: 24,
  Low: 72,
};

const VALID_TRANSITIONS = {
  Open: ['InProgress'],
  InProgress: ['Resolved'],
  Resolved: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['InProgress'],
};

function classifyTicket(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();
  let suggestedCategory = 'General';
  let suggestedPriority = 'Medium';

  const billingKeywords = ['invoice', 'payment', 'charge', 'refund', 'billing', 'subscription', 'price', 'cost', 'fee', 'receipt'];
  const techKeywords = ['login', 'error', 'crash', 'bug', 'broken', 'not working', 'loading', 'slow', 'freeze', 'install', 'update', 'password', 'authentication'];

  const billingScore = billingKeywords.filter(k => text.includes(k)).length;
  const techScore = techKeywords.filter(k => text.includes(k)).length;

  if (billingScore > techScore && billingScore > 0) {
    suggestedCategory = 'Billing';
  } else if (techScore > 0) {
    suggestedCategory = 'Technical';
  }

  const criticalKeywords = ['crash', 'cannot access', 'security breach', 'data loss', 'urgent'];
  const highKeywords = ['error', 'not working', 'broken', 'login', 'payment', 'charge', 'refund'];
  const lowKeywords = ['how to', 'question', 'suggestion', 'export'];

  if (criticalKeywords.some(k => text.includes(k))) {
    suggestedPriority = 'Critical';
  } else if (highKeywords.some(k => text.includes(k))) {
    suggestedPriority = 'High';
  } else if (lowKeywords.some(k => text.includes(k))) {
    suggestedPriority = 'Low';
  }

  return { suggestedCategory, suggestedPriority };
}

function computeSLA(priority, createdAt) {
  const targetHours = SLA_TARGETS[priority] || 24;
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + targetHours * 60 * 60 * 1000);
  const now = new Date();

  const remainingMs = deadline.getTime() - now.getTime();
  const remainingHours = remainingMs / (1000 * 60 * 60);

  if (remainingHours > targetHours * 0.3) {
    return { status: 'OnTrack', deadline: deadline.toISOString(), remainingHours: Math.round(remainingHours) };
  } else if (remainingHours > 0) {
    return { status: 'AtRisk', deadline: deadline.toISOString(), remainingHours: Math.round(remainingHours) };
  } else {
    return { status: 'Breached', deadline: deadline.toISOString(), remainingHours: Math.round(remainingHours) };
  }
}

router.get('/', authenticate, async (req, res) => {
  await getDb();
  let tickets;

  if (req.user.role === 'Customer') {
    tickets = all('SELECT * FROM tickets WHERE customer_id = ? ORDER BY created_at DESC', [req.user.id]);
  } else {
    tickets = all('SELECT * FROM tickets ORDER BY created_at DESC');
  }

  const enriched = tickets.map(t => ({
    ...t,
    sla: computeSLA(t.priority, t.created_at),
  }));

  res.json(enriched);
});

router.get('/suggest-classify', authenticate, (req, res) => {
  const { subject, description } = req.query;
  if (!subject && !description) {
    return res.status(400).json({ error: 'Provide subject or description' });
  }
  const result = classifyTicket(subject || '', description || '');
  res.json(result);
});

router.get('/:id', authenticate, async (req, res) => {
  await getDb();
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role === 'Customer' && ticket.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const assignee = ticket.assigned_to ? get('SELECT id, name, email FROM users WHERE id = ?', [ticket.assigned_to]) : null;
  const customer = get('SELECT id, name, email FROM users WHERE id = ?', [ticket.customer_id]);

  res.json({ ...ticket, sla: computeSLA(ticket.priority, ticket.created_at), assignee, customer });
});

router.get('/:id/summary', authenticate, async (req, res) => {
  await getDb();
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (req.user.role === 'Customer' && ticket.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const internalFilter = req.user.role === 'Customer' ? 'AND c.is_internal = 0' : '';
  const comments = all(`
    SELECT c.content, c.created_at, u.name as user_name, u.role as user_role
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.ticket_id = ? ${internalFilter}
    ORDER BY c.created_at ASC
  `, [req.params.id]);

  const assignee = ticket.assigned_to ? get('SELECT name FROM users WHERE id = ?', [ticket.assigned_to]) : null;
  const customer = get('SELECT name FROM users WHERE id = ?', [ticket.customer_id]);
  const lastComment = comments[comments.length - 1];

  const summary = summarizeConversation({
    subject: ticket.subject,
    description: ticket.description,
    comments,
  });

  res.json({
    facts: {
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignee: assignee ? assignee.name : null,
      customer: customer ? customer.name : null,
      created_at: ticket.created_at,
      last_activity: lastComment ? lastComment.created_at : ticket.updated_at,
      replyCount: comments.length,
    },
    ...summary,
  });
});

router.post('/', authenticate, async (req, res) => {
  await getDb();
  const { subject, description, category, priority } = req.body;

  const subjectError = text(subject, 'Subject', { min: 3, max: 160 });
  const descriptionError = text(description, 'Description', { min: 10, max: 5000 });
  if (subjectError || descriptionError) {
    return res.status(400).json({ error: subjectError || descriptionError });
  }

  const validCategories = CATEGORIES;
  const validPriorities = PRIORITIES;

  const { suggestedCategory, suggestedPriority } = classifyTicket(subject, description);

  const finalCategory = validCategories.includes(category) ? category : suggestedCategory;
  const finalPriority = validPriorities.includes(priority) ? priority : suggestedPriority;
  const autoSuggested = (!category && !priority) ? 1 : (category !== suggestedCategory || priority !== suggestedPriority) ? 1 : 0;

  const result = run('INSERT INTO tickets (subject, description, category, priority, status, customer_id, auto_suggested) VALUES (?, ?, ?, ?, ?, ?, ?)', [subject.trim(), description.trim(), finalCategory, finalPriority, 'Open', req.user.id, autoSuggested]);

  const ticket = get('SELECT * FROM tickets WHERE id = ?', [result.lastId]);
  const assignee = await autoAssignTicket(ticket);
  void sendTicketEmail({
    to: req.user.email,
    recipientName: req.user.name,
    ticket,
    subject: `Ticket #${ticket.id} created`,
    preview: `We received your support request: ${ticket.subject}`,
  });
  await autoRespondToTicket(ticket);
  res.status(201).json({ ...ticket, sla: computeSLA(ticket.priority, ticket.created_at), suggestedCategory, suggestedPriority, assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null });
});

router.patch('/:id', authenticate, requireRole('Admin', 'Agent'), async (req, res) => {
  await getDb();
  const { status, assigned_to } = req.body;
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (status) {
    const allowed = VALID_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${ticket.status} to ${status}` });
    }
    run('UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
  }

  if (assigned_to !== undefined) {
    const assignee = assigned_to === null ? null : id(assigned_to);
    if (assigned_to !== null && !assignee) {
      return res.status(400).json({ error: 'assigned_to must be a valid user id or null' });
    }
    if (assignee && !get("SELECT id FROM users WHERE id = ? AND role IN ('Admin', 'Agent')", [assignee])) {
      return res.status(400).json({ error: 'Ticket assignee must be an agent or administrator' });
    }
    run('UPDATE tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [assignee, req.params.id]);
  }

  const updated = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  res.json({ ...updated, sla: computeSLA(updated.priority, updated.created_at) });
});

module.exports = router;
