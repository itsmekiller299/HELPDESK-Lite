const express = require('express');
const { getDb, all } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const SLA_TARGETS = { Critical: 4, High: 8, Medium: 24, Low: 72 };

function computeSLAStatus(priority, createdAt) {
  const targetHours = SLA_TARGETS[priority] || 24;
  const deadline = new Date(new Date(createdAt).getTime() + targetHours * 60 * 60 * 1000);
  const now = new Date();
  const remaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (remaining > targetHours * 0.3) return 'OnTrack';
  if (remaining > 0) return 'AtRisk';
  return 'Breached';
}

router.get('/', authenticate, requireRole('Admin', 'Agent'), async (req, res) => {
  await getDb();

  const totalTickets = (await all('SELECT COUNT(*) as count FROM tickets'))[0].count;
  const byStatus = await all('SELECT status, COUNT(*) as count FROM tickets GROUP BY status');
  const byPriority = await all('SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority');
  const byCategory = await all('SELECT category, COUNT(*) as count FROM tickets GROUP BY category');

  const tickets = await all('SELECT id, priority, status, created_at FROM tickets');
  let slaBreached = 0;
  let slaAtRisk = 0;
  let slaOnTrack = 0;

  tickets.forEach(t => {
    if (['Resolved', 'Closed'].includes(t.status)) return;
    const sla = computeSLAStatus(t.priority, t.created_at);
    if (sla === 'Breached') slaBreached++;
    else if (sla === 'AtRisk') slaAtRisk++;
    else slaOnTrack++;
  });

  const recentTickets = await all(`
    SELECT t.*, u.name as customer_name
    FROM tickets t JOIN users u ON t.customer_id = u.id
    ORDER BY t.created_at DESC LIMIT 5
  `);

  const agents = await all(`
    SELECT u.id, u.name, COUNT(t.id) as ticket_count
    FROM users u LEFT JOIN tickets t ON t.assigned_to = u.id
    WHERE u.role IN ('Agent', 'Admin')
    GROUP BY u.id
  `);

  res.json({
    totalTickets,
    byStatus,
    byPriority,
    byCategory,
    sla: { breached: slaBreached, atRisk: slaAtRisk, onTrack: slaOnTrack },
    recentTickets,
    agents,
  });
});

module.exports = router;
