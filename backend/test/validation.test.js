const test = require('node:test');
const assert = require('node:assert/strict');
const { CATEGORIES, PRIORITIES, email, id, text } = require('../src/utils/validation');
const { escapeHtml } = require('../src/services/email');

test('text validation trims only after accepting a valid string', () => {
  assert.equal(text('  valid title  ', 'Title', { min: 3, max: 20 }), null);
  assert.match(text('x', 'Title', { min: 3 }), /between 3/);
  assert.match(text(null, 'Title'), /must be text/);
});

test('email validation accepts normal addresses and rejects malformed input', () => {
  assert.equal(email('person@example.com'), true);
  assert.equal(email('not-an-email'), false);
  assert.equal(email('person@example'), false);
});

test('id validation permits only positive safe integer IDs', () => {
  assert.equal(id('42'), 42);
  assert.equal(id(0), null);
  assert.equal(id('-3'), null);
  assert.equal(id('not-a-number'), null);
});

test('ticket enum allowlists remain constrained', () => {
  assert.deepEqual(CATEGORIES, ['Technical', 'Billing', 'General']);
  assert.deepEqual(PRIORITIES, ['Low', 'Medium', 'High', 'Critical']);
});

test('email template escaping prevents HTML injection', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
