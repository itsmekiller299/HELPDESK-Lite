const { getDb, get, all, run } = require('../db/schema');

const OPEN_STATUSES = ['Open', 'InProgress', 'Reopened'];

const SKILL_PROFILES = {
  'admin@helpdesk.com': 'Technical,Billing,General',
  'shiva123@gmail.com': 'Technical,General',
  'mani123@gmail.com': 'Billing,General',
};

async function ensureAgentSkills() {
  await getDb();
  for (const [email, skills] of Object.entries(SKILL_PROFILES)) {
    const user = await get('SELECT id FROM users WHERE email = ? AND is_bot = 0', [email]);
    if (user) {
      await run('UPDATE users SET skills = ? WHERE id = ?', [skills, user.id]);
    }
  }
}

function parseSkills(value) {
  if (!value) return [];
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

async function openWorkload(agentId) {
  const placeholders = OPEN_STATUSES.map(() => '?').join(', ');
  const row = await get(`SELECT COUNT(*) AS count FROM tickets WHERE assigned_to = ? AND status IN (${placeholders})`, [agentId, ...OPEN_STATUSES]);
  return row ? row.count : 0;
}

function rankAgents(agents, category) {
  return [...agents]
    .map(agent => ({ ...agent, skills: parseSkills(agent.skills), workload: agent.workload || 0 }))
    .sort((a, b) => {
      const aMatch = a.skills.includes(category);
      const bMatch = b.skills.includes(category);
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
      if (aMatch && bMatch) {
        const aSpecialized = a.skills.length;
        const bSpecialized = b.skills.length;
        if (aSpecialized !== bSpecialized) return aSpecialized - bSpecialized;
      }
      if (a.workload !== b.workload) return a.workload - b.workload;
      return a.name.localeCompare(b.name);
    });
}

async function pickBestAgent(ticket) {
  const candidates = await all(
    "SELECT id, name, email, skills FROM users WHERE role IN ('Agent','Admin') AND is_bot = 0 ORDER BY name",
  );
  const withWorkload = await Promise.all(
    candidates.map(async agent => ({ ...agent, workload: await openWorkload(agent.id) })),
  );
  if (withWorkload.length === 0) return null;
  const ranked = rankAgents(withWorkload, ticket.category);
  return ranked[0];
}

async function autoAssignTicket(ticket) {
  await getDb();
  if (ticket.assigned_to) return null;

  const agent = await pickBestAgent(ticket);
  if (!agent) return null;

  await run('UPDATE tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [agent.id, ticket.id]);

  await run('INSERT INTO comments (ticket_id, user_id, content, is_internal) VALUES (?, ?, ?, 1)', [
    ticket.id,
    agent.id,
    `Auto-assigned to ${agent.name} (${ticket.category} skill match, workload ${agent.workload}).`,
  ]);

  await run('INSERT INTO notifications (user_id, message, ticket_id) VALUES (?, ?, ?)', [
    agent.id,
    `New ticket #${ticket.id} assigned to you: ${ticket.subject}`,
    ticket.id,
  ]);

  const customer = await get('SELECT id FROM users WHERE id = ?', [ticket.customer_id]);
  if (customer) {
    await run('INSERT INTO notifications (user_id, message, ticket_id) VALUES (?, ?, ?)', [
      customer.id,
      `Your ticket #${ticket.id} has been assigned to ${agent.name}.`,
      ticket.id,
    ]);
  }

  return agent;
}

function isAssignableAgent(user) {
  return Boolean(user && !user.is_bot && (user.role === 'Agent' || user.role === 'Admin'));
}

module.exports = { ensureAgentSkills, autoAssignTicket, pickBestAgent, rankAgents, isAssignableAgent };