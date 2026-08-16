const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'but', 'by', 'can', 'could', 'did', 'do',
  'does', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 'he', 'help',
  'her', 'here', 'him', 'his', 'how', 'i', 'if', 'im', 'in', 'into', 'is',
  'it', 'its', 'ive', 'just', 'me', 'my', 'need', 'not', 'of', 'on', 'one',
  'or', 'our', 'please', 'so', 'that', 'the', 'their', 'them', 'then',
  'there', 'they', 'this', 'thanks', 'thank', 'to', 'us', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'who', 'will', 'with', 'would', 'you',
  'your', 'youre',
]);

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function wordsOf(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function buildFrequency(sentences) {
  const freq = {};
  let max = 1;
  sentences.forEach(s => {
    wordsOf(s).forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
      if (freq[w] > max) max = freq[w];
    });
  });
  return { freq, max };
}

function scoreSentence(sentence, freq, maxFreq, position) {
  const words = wordsOf(sentence);
  if (words.length === 0) return 0;
  const freqScore = words.reduce((sum, w) => sum + (freq[w] || 0), 0) / words.length / maxFreq;
  const positionScore = position === 0 ? 0.2 : 0;
  const lengthScore = Math.min(words.length / 12, 0.2);
  return freqScore + positionScore + lengthScore;
}

function summarizeConversation({ subject, description, comments = [] }) {
  const messages = [
    { author: 'Customer', text: description },
    ...comments.map(c => ({ author: c.user_role, text: c.content })),
  ];

  const allSentences = [];
  messages.forEach((m, messageIndex) => {
    splitSentences(m.text).forEach((sentence, position) => {
      allSentences.push({ sentence, author: m.author, position, messageIndex });
    });
  });

  const { freq, max } = buildFrequency(allSentences.map(s => s.sentence));
  const scored = allSentences.map(s => ({ ...s, score: scoreSentence(s.sentence, freq, max, s.position) }));
  scored.sort((a, b) => b.score - a.score);

  const limit = Math.min(6, Math.max(3, Math.ceil(allSentences.length / 4)));
  const points = scored
    .slice(0, limit)
    .sort((a, b) => a.messageIndex - b.messageIndex || a.position - b.position)
    .map(p => p.sentence);

  const questions = allSentences
    .filter(s => s.sentence.trim().endsWith('?'))
    .map(s => s.sentence)
    .slice(0, 4);

  const participants = [];
  const seen = new Set();
  messages.forEach(m => {
    if (m.author && !seen.has(m.author)) {
      seen.add(m.author);
      participants.push(m.author);
    }
  });

  return { subject, points, questions, participants };
}

module.exports = { summarizeConversation };