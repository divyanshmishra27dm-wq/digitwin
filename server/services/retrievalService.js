const Knowledge = require('../models/Knowledge');

/**
 * Tokenizer with basic stemming and common stop-word filtering.
 */
function tokenize(text) {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'to',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'can',
    'you', 'your', 'tell', 'me', 'what', 'how', 'why', 'who', 'when', 'where'
  ]);

  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w))
    .map((w) => {
      // Basic stemming
      if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
      if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
      if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
      if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
      if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
      return w;
    });
}

const OVERVIEW_KEYWORDS = [
  'project', 'projects', 'work', 'worked', 'background', 'experience', 'experiences',
  'tell', 'who', 'what', 'about', 'everything', 'overview', 'summary', 'career',
  'portfolio', 'resume', 'skills', 'built', 'created', 'developed', 'specialty', 'speciality'
];

/**
 * Enhanced Hybrid RAG Retrieval Engine:
 * Combines Lexical BM25-style scoring, Title & Tag boosting, Exact phrase matching,
 * and Multi-turn conversational context resolution.
 */
async function retrieveRelevantKnowledge(twinId, question, history = [], limit = 8) {
  const entries = await Knowledge.find({ twinId }).lean();
  if (entries.length === 0) return [];

  // If the Twin has a moderate sized knowledge base (e.g. <= 16 entries),
  // return all entries so the system prompt has complete documented context
  if (entries.length <= 16) {
    return entries;
  }

  // Combine current question with recent conversation history for context-aware search
  const recentHistoryText = (history || [])
    .slice(-4)
    .map((m) => (m.role === 'user' ? m.content : (m.content || '').slice(0, 150)))
    .join(' ');
  const contextualQuery = `${question} ${recentHistoryText}`.trim();

  const qTokens = new Set(tokenize(question));
  const ctxTokens = new Set(tokenize(contextualQuery));
  const qLower = question.toLowerCase();

  const isOverview = OVERVIEW_KEYWORDS.some((kw) => qLower.includes(kw));
  if (isOverview && entries.length <= 25) {
    return entries;
  }

  const scored = entries.map((entry) => {
    let score = 0;
    const titleLower = (entry.title || '').toLowerCase();
    const summaryLower = (entry.summary || '').toLowerCase();
    const contentLower = (entry.content || '').toLowerCase();
    const categoryLower = (entry.category || '').toLowerCase();
    const tagsLower = (entry.tags || []).join(' ').toLowerCase();

    // 1. Exact phrase in title or summary is a massive signal
    if (qLower.length > 3) {
      if (titleLower.includes(qLower) || qLower.includes(titleLower)) {
        score += 25;
      }
      if (summaryLower.includes(qLower)) {
        score += 12;
      }
    }

    // 2. Token matches in title (high weight)
    const titleTokens = tokenize(entry.title);
    for (const token of titleTokens) {
      if (qTokens.has(token)) score += 6;
      else if (ctxTokens.has(token)) score += 3;
    }

    // 3. Category & Tags matches
    const tagTokens = tokenize(`${entry.category} ${(entry.tags || []).join(' ')}`);
    for (const token of tagTokens) {
      if (qTokens.has(token)) score += 4;
      else if (ctxTokens.has(token)) score += 2;
    }

    // 4. Summary & Content matches
    const bodyTokens = tokenize(`${entry.summary} ${entry.content}`);
    const bodyFreq = {};
    for (const token of bodyTokens) {
      bodyFreq[token] = (bodyFreq[token] || 0) + 1;
    }

    for (const token of qTokens) {
      if (bodyFreq[token]) {
        score += Math.min(bodyFreq[token] * 1.5, 6);
      }
    }
    for (const token of ctxTokens) {
      if (!qTokens.has(token) && bodyFreq[token]) {
        score += Math.min(bodyFreq[token] * 0.8, 3);
      }
    }

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const relevant = scored.filter((s) => s.score > 0).slice(0, limit);

  // If nothing matched lexically, provide top 5 entries for context rather than 0
  if (relevant.length === 0) {
    return entries.slice(0, 5);
  }

  return relevant.map((s) => s.entry);
}

module.exports = { retrieveRelevantKnowledge };
