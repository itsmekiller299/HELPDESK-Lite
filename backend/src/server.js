require('dotenv').config();
const { createApp } = require('./app');
const { getDb } = require('./db/schema');
const { ensureAutoAgents } = require('./services/auto-responder');
const { ensureAgentSkills } = require('./services/auto-assign');

const PORT = process.env.PORT || 4000;

getDb().then(async () => {
  await ensureAutoAgents();
  await ensureAgentSkills();
  createApp().listen(PORT, () => {
    console.log(`HelpDesk Lite API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});