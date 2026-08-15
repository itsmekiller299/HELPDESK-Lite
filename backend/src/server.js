require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/schema');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const commentRoutes = require('./routes/comments');
const kbRoutes = require('./routes/kb');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const { ensureAutoAgents } = require('./services/auto-responder');
const { ensureAgentSkills } = require('./services/auto-assign');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the API');
}

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(origin => origin.trim());
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'HelpDesk Lite API', version: '1.0.0', endpoints: ['/api/auth', '/api/tickets', '/api/comments', '/api/kb', '/api/analytics', '/api/users'] });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

getDb().then(async () => {
  await ensureAutoAgents();
  await ensureAgentSkills();
  app.listen(PORT, () => {
    console.log(`HelpDesk Lite API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
