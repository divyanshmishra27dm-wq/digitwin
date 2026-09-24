const axios = require('axios');
const { retrieveRelevantKnowledge } = require('./retrievalService');
const { buildSystemPrompt } = require('./personaService');
const { getDemoResponse } = require('./demoService');

// This app talks to a LiteLLM proxy (NIIT's internal gateway) rather than
// OpenAI directly. LITELLM_BASE_URL should be the proxy's base, e.g.
// https://litellm.niit.com/v1 — the /chat/completions path is appended below.
const isDemoMode = () => !process.env.LITELLM_API_KEY;

/**
 * Core orchestration:
 *   question -> retrieve knowledge -> build persona/system prompt
 *            -> call LLM (or demo) -> validate -> structured response
 */
async function generateTwinResponse(twin, question, history = [], user = null) {
  const knowledgeEntries = await retrieveRelevantKnowledge(twin._id, question, history);

  if (isDemoMode()) {
    return getDemoResponse(question, knowledgeEntries, history);
  }

  const systemPrompt = buildSystemPrompt(twin, knowledgeEntries, user);

  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');

  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-8)) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'twin' || msg.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            answer: msg.content,
            responseType: msg.responseType || 'documented',
            confidence: msg.confidence || 'high',
            sources: msg.sources || [],
            canEscalate: Boolean(msg.canEscalate),
          }),
        });
      }
    }
  }

  messages.push({ role: 'user', content: question });

  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: process.env.LITELLM_MODEL || 'azure-gpt-l1',
        messages,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LITELLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const raw = response.data.choices?.[0]?.message?.content || '{}';
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);

    return validateResponse(parsed, knowledgeEntries);
  } catch (err) {
    console.error('[aiService] LLM call failed, falling back to demo response:', err.message);
    return getDemoResponse(question, knowledgeEntries, history);
  }
}

function validateResponse(parsed, knowledgeEntries = []) {
  const allowedTypes = ['documented', 'inferred', 'insufficient_information'];
  const allowedConfidence = ['high', 'medium', 'low'];

  let sources = Array.isArray(parsed.sources) ? parsed.sources.filter((s) => s && s.title) : [];
  
  // Clean up source titles to match documented titles if needed
  if (sources.length > 0 && knowledgeEntries.length > 0) {
    sources = sources.map((s) => {
      const match = knowledgeEntries.find(
        (k) => k.title.toLowerCase() === s.title.toLowerCase() || s.title.toLowerCase().includes(k.title.toLowerCase())
      );
      return { title: match ? match.title : s.title };
    });
  }

  const responseType = allowedTypes.includes(parsed.responseType) ? parsed.responseType : 'insufficient_information';
  const confidence = allowedConfidence.includes(parsed.confidence) ? parsed.confidence : 'low';

  const suggestedOptions = Array.isArray(parsed.suggestedOptions)
    ? parsed.suggestedOptions.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim())
    : [];

  const followUpQuestions = Array.isArray(parsed.followUpQuestions)
    ? parsed.followUpQuestions.filter((q) => typeof q === 'string' && q.trim()).map((q) => q.trim())
    : [];

  return {
    answer: typeof parsed.answer === 'string' && parsed.answer.trim()
      ? parsed.answer.trim()
      : "I don't have enough documented information in this Twin's knowledge base to answer that accurately.",
    responseType,
    confidence,
    sources,
    canEscalate: typeof parsed.canEscalate === 'boolean' ? parsed.canEscalate : responseType !== 'documented',
    suggestedOptions,
    followUpQuestions,
  };
}

module.exports = { generateTwinResponse, isDemoMode };

