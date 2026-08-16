const { createApp } = require('../src/app');
const { getDb } = require('../src/db/schema');
const { ensureAutoAgents } = require('../src/services/auto-responder');
const { ensureAgentSkills } = require('../src/services/auto-assign');

let ready = null;
let app = null;

async function ensureReady() {
  if (!ready) {
    ready = (async () => {
      await getDb();
      await ensureAutoAgents();
      await ensureAgentSkills();
      app = createApp();
    })();
  }
  await ready;
  return app;
}

module.exports = async (req, res) => {
  const instance = await ensureReady();
  return instance(req, res);
};