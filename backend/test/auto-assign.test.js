const test = require('node:test');
const assert = require('node:assert/strict');
const { rankAgents } = require('../src/services/auto-assign');

test('rankAgents prioritizes agents whose skills match the ticket category', () => {
  const agents = [
    { id: 1, name: 'Agent A', skills: 'Technical', workload: 5 },
    { id: 2, name: 'Agent B', skills: 'Billing,General', workload: 1 },
  ];
  const ranked = rankAgents(agents, 'Technical');
  assert.equal(ranked[0].id, 1);
  assert.equal(ranked[1].id, 2);
});

test('rankAgents prefers a specialist over a generalist matching the category', () => {
  const agents = [
    { id: 1, name: 'Admin', skills: 'Technical,Billing,General', workload: 0 },
    { id: 2, name: 'Tech Agent', skills: 'Technical,General', workload: 0 },
  ];
  const ranked = rankAgents(agents, 'Technical');
  assert.equal(ranked[0].id, 2);
  assert.equal(ranked[1].id, 1);
});

test('rankAgents breaks ties by lowest open workload', () => {
  const agents = [
    { id: 1, name: 'Agent A', skills: 'Technical,Billing', workload: 9 },
    { id: 2, name: 'Agent B', skills: 'Technical', workload: 2 },
    { id: 3, name: 'Agent C', skills: 'Technical', workload: 7 },
  ];
  const ranked = rankAgents(agents, 'Technical');
  assert.equal(ranked[0].id, 2);
  assert.equal(ranked[1].id, 3);
  assert.equal(ranked[2].id, 1);
});

test('rankAgents falls back to non-matching agents and sorts by workload', () => {
  const agents = [
    { id: 1, name: 'Agent A', skills: 'Technical', workload: 3 },
    { id: 2, name: 'Agent B', skills: 'Billing', workload: 1 },
  ];
  const ranked = rankAgents(agents, 'General');
  assert.equal(ranked[0].id, 2);
  assert.equal(ranked[1].id, 1);
});

test('rankAgents treats empty skill lists and unknown categories gracefully', () => {
  const agents = [
    { id: 1, name: 'Agent A', skills: null, workload: 4 },
    { id: 2, name: 'Agent B', skills: '', workload: 0 },
  ];
  const ranked = rankAgents(agents, 'Technical');
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].id, 2);
});

test('rankAgents does not mutate the input array', () => {
  const agents = [
    { id: 1, name: 'Agent A', skills: 'Technical', workload: 1 },
    { id: 2, name: 'Agent B', skills: 'Billing', workload: 2 },
  ];
  rankAgents(agents, 'Technical');
  assert.equal(agents[0].id, 1);
  assert.equal(agents[1].id, 2);
});