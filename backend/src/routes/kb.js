const express = require('express');
const { getDb, run, get, all } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  await getDb();
  const { search, category } = req.query;

  let query = 'SELECT * FROM knowledge_base';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push('(title LIKE ? OR body LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';
  const articles = all(query, params);
  res.json(articles);
});

router.get('/suggest', authenticate, async (req, res) => {
  await getDb();
  const { subject, description } = req.query;
  const text = `${subject || ''} ${description || ''}`.toLowerCase();

  if (!text.trim()) {
    return res.json([]);
  }

  const articles = all('SELECT * FROM knowledge_base');

  const scored = articles.map(article => {
    const titleLower = article.title.toLowerCase();
    const bodyLower = article.body.toLowerCase();
    let score = 0;

    const words = text.split(/\s+/).filter(w => w.length > 2);
    words.forEach(word => {
      if (titleLower.includes(word)) score += 3;
      if (bodyLower.includes(word)) score += 1;
    });

    return { ...article, score };
  }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

  res.json(scored);
});

router.post('/', authenticate, requireRole('Admin'), async (req, res) => {
  await getDb();
  const { title, body, category } = req.body;

  if (!title || !body || !category) {
    return res.status(400).json({ error: 'Title, body, and category are required' });
  }

  const result = run('INSERT INTO knowledge_base (title, body, category, created_by) VALUES (?, ?, ?, ?)', [title, body, category, req.user.id]);
  const article = get('SELECT * FROM knowledge_base WHERE id = ?', [result.lastId]);
  res.status(201).json(article);
});

router.put('/:id', authenticate, requireRole('Admin'), async (req, res) => {
  await getDb();
  const { title, body, category } = req.body;

  const existing = get('SELECT * FROM knowledge_base WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Article not found' });
  }

  run('UPDATE knowledge_base SET title = ?, body = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title || existing.title, body || existing.body, category || existing.category, req.params.id]);

  const updated = get('SELECT * FROM knowledge_base WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', authenticate, requireRole('Admin'), async (req, res) => {
  await getDb();
  const existing = get('SELECT * FROM knowledge_base WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Article not found' });
  }

  run('DELETE FROM knowledge_base WHERE id = ?', [req.params.id]);
  res.json({ message: 'Article deleted' });
});

module.exports = router;
