const bcrypt = require('bcryptjs');
const { getDb, get, all, run } = require('../db/schema');

const BOT_PASSWORD = 'autoagent-bot-password';

const AUTO_AGENTS = [
  {
    key: 'technical',
    name: 'Technical Support Bot',
    email: 'techbot@helpdesk.com',
    category: 'Technical',
  },
  {
    key: 'billing',
    name: 'Billing Support Bot',
    email: 'billingbot@helpdesk.com',
    category: 'Billing',
  },
  {
    key: 'general',
    name: 'General Support Bot',
    email: 'generalbot@helpdesk.com',
    category: 'General',
  },
  {
    key: 'priority',
    name: 'Priority Support Bot',
    email: 'prioritybot@helpdesk.com',
    category: null,
  },
];

async function ensureAutoAgents() {
  await getDb();
  const passwordHash = bcrypt.hashSync(BOT_PASSWORD, 10);
  for (const agent of AUTO_AGENTS) {
    const existing = get('SELECT id FROM users WHERE email = ?', [agent.email]);
    if (!existing) {
      run('INSERT INTO users (name, email, password, role, is_bot) VALUES (?, ?, ?, ?, 1)', [
        agent.name,
        agent.email,
        passwordHash,
        'Agent',
      ]);
    }
  }
}

function pickAutoAgent(ticket) {
  if (ticket.priority === 'Critical') {
    return AUTO_AGENTS.find(agent => agent.key === 'priority');
  }
  const categoryAgent = AUTO_AGENTS.find(agent => agent.category === ticket.category);
  return categoryAgent || AUTO_AGENTS.find(agent => agent.key === 'general');
}

function buildAutoResponse(ticket, agent) {
  const priority = ticket.priority;
  const name = agent.name;

  if (agent.key === 'priority') {
    return `Hi, thanks for reaching out. This is ${name}. Your ticket #${ticket.id} (${priority} priority) has been flagged as urgent, so I've escalated it to our senior team for immediate attention.\n\nTo help us resolve it faster, please confirm:\n1. When did the issue start?\n2. What exactly are you seeing (error messages, screenshots)?\n3. Any steps you've already tried?\n\nWe'll keep you posted here on the ticket.`;
  }

  const responses = {
    Technical: `Hi, thanks for your message. This is ${name}. I'll look into the technical issue you reported on ticket #${ticket.id}.\n\nIn the meantime, could you confirm a few details to help us diagnose faster:\n1. What device and browser/OS are you using?\n2. Does the problem happen every time or intermittently?\n3. Have you tried clearing your cache or restarting the app?\n\nOur team will follow up shortly.`,
    Billing: `Hi, thanks for contacting us about billing. This is ${name}. I've noted your request on ticket #${ticket.id}.\n\nTo speed things up, could you please share:\n1. The account email used for the charge\n2. The transaction or invoice reference number\n3. The amount and date in question\n\nOur billing team will review and update you here shortly.`,
    General: `Hi, thanks for your message. This is ${name}. I've received your request on ticket #${ticket.id} and our support team will get back to you shortly.\n\nIf you'd like to speed things up, feel free to share any additional details about what you need help with.`,
  };

  return responses[ticket.category] || responses.General;
}

async function autoRespondToTicket(ticket) {
  await getDb();
  const agent = pickAutoAgent(ticket);
  const bot = get('SELECT id, name FROM users WHERE email = ?', [agent.email]);
  if (!bot) return;

  const content = buildAutoResponse(ticket, agent);
  run('INSERT INTO comments (ticket_id, user_id, content, is_internal) VALUES (?, ?, ?, 0)', [ticket.id, bot.id, content]);
  run('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticket.id]);

  const customer = get('SELECT id FROM users WHERE id = ?', [ticket.customer_id]);
  if (customer) {
    run('INSERT INTO notifications (user_id, message, ticket_id) VALUES (?, ?, ?)', [
      customer.id,
      `Auto response from ${bot.name} on ticket #${ticket.id}: ${ticket.subject}`,
      ticket.id,
    ]);
  }
}

function isBotUser(user) {
  return Boolean(user && user.is_bot);
}

module.exports = { ensureAutoAgents, autoRespondToTicket, isBotUser, AUTO_AGENTS };