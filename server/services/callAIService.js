const axios = require('axios');
const Knowledge = require('../models/Knowledge');
const { retrieveRelevantKnowledge } = require('./retrievalService');
const { isDemoMode } = require('./aiService');

/**
 * Call AI Service: Spoken Team Calls & Multi-Twin Debate Engine
 */

/**
 * Generate a spoken turn for a Digital Twin on a live team call
 */
async function generateCallTurn({
  call,
  speakingTwin,
  allTwins = [],
  user = null,
  userMessage = null,
  isDebate = false,
  userInstruction = null,
  interruptedTwin = null,
}) {
  const previousTurns = call.turns || [];
  const query = `${call.topic} ${userMessage || ''}`;
  const history = previousTurns.slice(-6).map((t) => ({
    role: t.speakerRole === 'user' ? 'user' : 'twin',
    content: t.content,
  }));

  let knowledgeEntries = [];
  try {
    knowledgeEntries = await retrieveRelevantKnowledge(speakingTwin._id, query, history);
  } catch (err) {
    console.warn('[callAIService] Knowledge retrieval warning:', err.message);
  }

  if (isDemoMode()) {
    return generateDemoCallTurn({
      call,
      speakingTwin,
      allTwins,
      user,
      userMessage,
      isDebate,
      userInstruction,
      interruptedTwin,
    });
  }

  const otherTwins = allTwins.filter((t) => t._id.toString() !== speakingTwin._id.toString());
  const otherNames = otherTwins.map((t) => `${t.name} (${t.title}, ${t.dept})`).join(', ');
  const lastTurn = previousTurns.length > 0 ? previousTurns[previousTurns.length - 1] : null;

  const systemPrompt = `You are the AI Digital Twin of ${speakingTwin.name} (${speakingTwin.title || 'Expert'}, Department of ${speakingTwin.dept || 'Engineering'} at ${speakingTwin.organization || 'NIIT Ltd.'}).

YOU ARE CURRENTLY SPEAKING ON A LIVE VOICE/VIDEO TEAM CALL WITH COLLEAGUES AND THE USER.
- Meeting Topic / Agenda: "${call.topic}"
- Call Mode: ${call.mode === 'debate' ? 'Cross-Functional Debate' : 'Collaborative Team Call'}
- Participants on the call: ${otherNames || 'None'}
${user ? `- Host / Caller: ${user.name} (${user.title || 'User'})` : ''}

YOUR PERSONA & EXPERTISE:
- Department: ${speakingTwin.dept || 'Engineering'}
- Key Expertise: ${(speakingTwin.expertise || []).join(', ')}
- Style: ${(speakingTwin.communicationStyle || []).join(', ')}
- Core Thinking Philosophy: ${(speakingTwin.thinkingPatterns || []).join('; ')}

CRITICAL SPOKEN-CALL RULES:
1. SPEAK CONVERSATIONALLY FOR VOICE SYNTHESIS: Keep your response natural, spoken, and punchy (around 2 to 4 sentences, roughly 30-60 words). Avoid bullet points and markdown headers in spokenText because this will be spoken aloud to everyone via Text-to-Speech!
2. INTERACTIVE DYNAMICS:
   - You can directly answer questions from the user or colleagues.
   - You can agree or constructively challenge/debate a peer's viewpoint (especially if Mode is debate).
   - IMPORTANT: Frequently ask a targeted follow-up question to either the user (e.g. "Divyansh, what's our target completion date?") or to another peer on call (e.g. "Sneha, how does that affect our zero-trust boundary?").
3. Always stay in character as ${speakingTwin.name}'s digital twin.

DOCUMENTED KNOWLEDGE:
${knowledgeEntries.map((k) => `[${k.title}]: ${k.summary} - ${k.content}`).join('\n\n') || '(Use baseline domain expertise)'}

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "spokenText": "string - natural, conversational speech to be spoken aloud via TTS. Clean phrasing without asterisks or bullet lists.",
  "content": "string - full transcript with markdown if needed for the call log",
  "perspective": "string - your angle (e.g. 'Security Architecture' or 'Product MVP Feasibility')",
  "addressedTo": ["string - name(s) of people you addressed on call, e.g. ['Sneha Reddy'] or ['User']"],
  "questionTarget": "string or null - 'user', or the exact name of a colleague if you asked a direct question, or null",
  "directQuestion": "string or null - the direct question you asked, or null if no question posed",
  "isDebateChallenge": boolean - true if you challenged or debated someone's point
}`;

  const messages = [{ role: 'system', content: systemPrompt }];

  // Add recent speech turns
  for (const turn of previousTurns.slice(-8)) {
    if (turn.speakerRole === 'user') {
      messages.push({
        role: 'user',
        content: `[Spoken by ${turn.speakerName}]: ${turn.spokenText || turn.content}`,
      });
    } else {
      messages.push({
        role: 'assistant',
        content: `[Spoken by ${turn.speakerName}]: ${turn.spokenText || turn.content}`,
      });
    }
  }

  if (interruptedTwin) {
    const isSelf = speakingTwin.name.toLowerCase().includes((interruptedTwin.name || '').toLowerCase());
    messages.push({
      role: 'user',
      content: `[LIVE CALL EVENT: USER INTERRUPTED ${interruptedTwin.name.toUpperCase()}]:
The user ${user?.name || 'Moderator'} just interrupted ${interruptedTwin.name} mid-sentence while ${interruptedTwin.name} was saying: "${interruptedTwin.spokenSoFar || interruptedTwin.text}".
The user said: "${userMessage}".

MANDATORY CONVERSATIONAL DIRECTIVE:
You must acknowledge this interruption like a real person in a meeting:
${isSelf
  ? `Since you are ${speakingTwin.name} and were interrupted, start your response with: "Yes noted, but as I was saying..." or "Yes noted, but let me complete: [finish the key thought briefly]... and to your question, [address user's point]."`
  : `Acknowledge that ${interruptedTwin.name} was speaking, e.g.: "Yes noted ${user?.name || 'Moderator'}, though let's make sure ${interruptedTwin.name} gets to complete that thought..."`}
Keep your answer natural, spoken, and fast-paced (around 35-50 words).`,
    });
  } else if (userMessage) {
    messages.push({
      role: 'user',
      content: `[User ${user?.name || 'Moderator'} just said on the call]: "${userMessage}". Respond directly as ${speakingTwin.name}.`,
    });
  } else if (lastTurn && lastTurn.speakerName !== speakingTwin.name) {
    messages.push({
      role: 'user',
      content: `[Live Call Handover]: ${lastTurn.speakerName} just spoke: "${lastTurn.spokenText || lastTurn.content}". It is now ${speakingTwin.name}'s turn. React, share your perspective, and pose a question if helpful.`,
    });
  } else {
    messages.push({
      role: 'user',
      content: `[Call Opening]: Give your opening spoken remarks on the topic "${call.topic}".`,
    });
  }

  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');

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
        timeout: 25000,
      }
    );

    const raw = response.data.choices?.[0]?.message?.content || '{}';
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);

    const spokenText = parsed.spokenText || parsed.content || `From my perspective in ${speakingTwin.dept || 'Engineering'}, we need to approach this practically.`;
    const content = parsed.content || spokenText;

    return {
      spokenText,
      content,
      perspective: parsed.perspective || `${speakingTwin.dept || 'Domain'} Perspective`,
      addressedTo: Array.isArray(parsed.addressedTo) ? parsed.addressedTo : [],
      questionTarget: parsed.questionTarget || null,
      directQuestion: parsed.directQuestion || null,
      isDebateChallenge: !!parsed.isDebateChallenge,
    };
  } catch (err) {
    console.error('[callAIService] LLM call failed, falling back to simulated call turn:', err.message);
    return generateDemoCallTurn({
      call,
      speakingTwin,
      allTwins,
      user,
      userMessage,
      isDebate,
      userInstruction,
    });
  }
}

/**
 * Dynamic offline/demo voice conversation generator
 */
function generateDemoCallTurn({
  call,
  speakingTwin,
  allTwins,
  user,
  userMessage,
  isDebate,
  interruptedTwin,
}) {
  const turns = call.turns || [];
  const otherTwins = allTwins.filter((t) => t._id.toString() !== speakingTwin._id.toString());
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const userName = user?.name || 'Moderator';
  const name = speakingTwin.name;

  const isDivyansh = name.toLowerCase().includes('divyansh');
  const isPooja = name.toLowerCase().includes('pooja');
  const isSneha = name.toLowerCase().includes('sneha');
  const isAarav = name.toLowerCase().includes('aarav');

  let spokenText = '';
  let perspective = '';
  let addressedTo = [];
  let questionTarget = null;
  let directQuestion = null;
  let isDebateChallenge = false;

  // Check if this was an interruption
  if (interruptedTwin) {
    const isSelf = speakingTwin.name.toLowerCase().includes((interruptedTwin.name || '').toLowerCase());
    addressedTo.push(userName);
    const cutOff = (interruptedTwin.spokenSoFar || interruptedTwin.text || '').replace(/\.+$/, '');
    perspective = isSelf ? 'Resuming Interrupted Statement' : 'Addressing Interruption';

    if (isSelf) {
      spokenText = `Yes noted, but let me complete: I was saying that ${cutOff.slice(0, 95)}... And regarding what you just brought up about ${userMessage ? `"${userMessage}"` : 'that point'}, we can definitely account for it.`;
    } else {
      spokenText = `Yes noted ${userName}, but as ${interruptedTwin.name} was emphasizing before: ${cutOff.slice(0, 85)}. Regarding your question, we should factor that in right now.`;
    }
    questionTarget = 'user';
    directQuestion = 'Does that align with your thinking?';
  } else if (userMessage) {
    addressedTo.push(userName);
    if (isDivyansh) {
      perspective = 'Practical AI & System Architecture';
      spokenText = `Thanks for asking, ${userName}. My philosophy is always problem-first: before we write a single line of orchestration code, let's look at the existing data and build a tight Dockerized POC. Sneha, from a security standpoint, what's your take on running this inference in private containers?`;
      questionTarget = 'Sneha Reddy';
      directQuestion = "What's your take on running this inference in private containers?";
    } else if (isSneha) {
      perspective = 'Zero-Trust Security & IAM';
      spokenText = `Good question, ${userName}. We have to assume breach from day one. I'd mandate mutual TLS between all microservices and strict Keycloak token validation. Aarav, can your LLM mesh handle per-tenant token decryption without latency spikes?`;
      questionTarget = 'Dr. Aarav Kapoor';
      directQuestion = 'Can your LLM mesh handle per-tenant token decryption without latency spikes?';
    } else if (isPooja) {
      perspective = 'Product Strategy & UX';
      spokenText = `Appreciate the question, ${userName}. Technically it might be feasible, but from a product lens, will our end users actually adopt it? Divyansh, what's the shortest MVP we can put in front of pilot users next week?`;
      questionTarget = 'Divyansh Mishra';
      directQuestion = "What's the shortest MVP we can put in front of pilot users next week?";
    } else if (isAarav) {
      perspective = 'Enterprise Foundation Architecture';
      spokenText = `To address that, ${userName}, we should decouple the reasoning models from state storage. By using a Redis semantic cache, we can achieve sub-200ms latency. Divyansh, are you planning to stream the tokens directly to the client UI?`;
      questionTarget = 'Divyansh Mishra';
      directQuestion = 'Are you planning to stream the tokens directly to the client UI?';
    } else {
      perspective = `${speakingTwin.dept || 'Domain'} Strategy`;
      spokenText = `I hear you, ${userName}. In our department, we focus heavily on operational reliability. ${otherTwins[0] ? otherTwins[0].name : 'Team'}, how do we align this with our quarterly milestones?`;
      questionTarget = otherTwins[0] ? otherTwins[0].name : 'user';
      directQuestion = 'How do we align this with our quarterly milestones?';
    }
  } else if (lastTurn && lastTurn.speakerRole === 'twin') {
    // Twin responding to twin or debating
    const lastSpeaker = lastTurn.speakerName;
    addressedTo.push(lastSpeaker);

    if (isDivyansh) {
      perspective = 'Execution & Deployment';
      if (lastSpeaker.toLowerCase().includes('sneha')) {
        isDebateChallenge = true;
        spokenText = `I agree with Sneha on zero-trust, but if we add too many validation gates on the initial POC, we will kill team velocity. ${userName}, could we start with isolated sandbox tokens for the pilot phase?`;
        questionTarget = 'user';
        directQuestion = 'Could we start with isolated sandbox tokens for the pilot phase?';
      } else {
        spokenText = `Building on what ${lastSpeaker} just highlighted, let's keep the service boundaries clean. In NexIQ, containerizing early saved us weeks of rework. Pooja, does that match your expected user rollout?`;
        questionTarget = 'Pooja Verma';
        directQuestion = 'Does that match your expected user rollout?';
      }
    } else if (isSneha) {
      perspective = 'Security & Governance';
      isDebateChallenge = true;
      spokenText = `I understand Divyansh's need for speed, but security cannot be an afterthought retrofitted at deployment. If an API key or session token leaks, the cost is catastrophic. Aarav, can we enforce automated policy checks inside the mesh pipeline?`;
      questionTarget = 'Dr. Aarav Kapoor';
      directQuestion = 'Can we enforce automated policy checks inside the mesh pipeline?';
    } else if (isPooja) {
      perspective = 'User Journey & Prioritization';
      spokenText = `Both engineering velocity and security are vital, but let's remember our customers. If the login flow has four friction steps, users simply won't use it. ${userName}, what is the single most critical problem we are solving for leadership here?`;
      questionTarget = 'user';
      directQuestion = 'What is the single most critical problem we are solving for leadership here?';
    } else if (isAarav) {
      perspective = 'Scalable Systems & Benchmarking';
      spokenText = `We can actually satisfy both Sneha and Divyansh. By embedding policy guardrails at the reverse proxy layer, we protect the perimeter while keeping the inner services agile. Sneha, would automated hallucination benchmarks address your governance concerns?`;
      questionTarget = 'Sneha Reddy';
      directQuestion = 'Would automated hallucination benchmarks address your governance concerns?';
    } else {
      perspective = `${speakingTwin.dept || 'Domain'} Insight`;
      spokenText = `That's a valid point by ${lastSpeaker}. From our operational baseline, we need to balance performance with resilience. ${userName}, would you like us to synthesize a consensus on this?`;
      questionTarget = 'user';
      directQuestion = 'Would you like us to synthesize a consensus on this?';
    }
  } else {
    // Opening remarks
    if (isDivyansh) {
      perspective = 'Practical AI POC';
      spokenText = `Hey team, glad to jump on this call. Regarding "${call.topic}", I recommend we start with the problem, inspect the data we currently possess, and build a rapid containerized prototype. Pooja, what's the primary user friction point from your side?`;
      questionTarget = 'Pooja Verma';
      directQuestion = "What's the primary user friction point from your side?";
    } else if (isPooja) {
      perspective = 'Product Vision';
      spokenText = `Hello everyone! Looking at "${call.topic}", our goal today is aligning on customer impact. Let's make sure whatever we architect delivers tangible, measurable value. Sneha, are there any immediate compliance constraints we should flag?`;
      questionTarget = 'Sneha Reddy';
      directQuestion = 'Are there any immediate compliance constraints we should flag?';
    } else if (isSneha) {
      perspective = 'Zero-Trust Architecture';
      spokenText = `Hi all. As we discuss "${call.topic}", my focus is securing our identity perimeters and enforcing zero trust from day one. Divyansh, how are we handling data segregation for this project?`;
      questionTarget = 'Divyansh Mishra';
      directQuestion = 'How are we handling data segregation for this project?';
    } else if (isAarav) {
      perspective = 'Enterprise Foundation Strategy';
      spokenText = `Welcome everyone. For "${call.topic}", we must architect for horizontal scale and sub-second latency from day one. I'm keen to hear where everyone stands on the core trade-offs. ${userName}, what's your primary success metric for this session?`;
      questionTarget = 'user';
      directQuestion = "What's your primary success metric for this session?";
    } else {
      perspective = 'Strategic Direction';
      spokenText = `Hello team. Let's use this call to dive deep into "${call.topic}" and reach a solid operational consensus. Who would like to lay out the technical baseline first?`;
      questionTarget = 'all';
      directQuestion = 'Who would like to lay out the technical baseline first?';
    }
  }

  return {
    spokenText,
    content: spokenText,
    perspective,
    addressedTo,
    questionTarget,
    directQuestion,
    isDebateChallenge,
  };
}

/**
 * Generate call executive summary & actionable decisions
 */
async function generateCallSummary({ call }) {
  const turns = call.turns || [];
  const participants = Array.from(new Set(turns.map((t) => t.speakerName))).join(', ');

  const summary = {
    overview: `Team call on "${call.topic}" with ${turns.length} conversational turns across participants: ${participants || 'Team'}.`,
    consensus:
      'The panel aligned on starting with a rapid, containerized proof of concept while embedding zero-trust security policies and maintaining strict sub-second latency SLAs.',
    keyDecisions: [
      'Adopt a decoupled microservice architecture to test rapid prototypes before enterprise-wide scaling.',
      'Enforce mutual TLS and Keycloak token authentication at the perimeter gateway.',
      'Establish continuous pilot feedback loops to validate end-user adoption early.',
    ],
    actionItems: [
      {
        task: 'Draft containerized POC architecture and API boundary specs',
        owner: 'Divyansh Mishra',
        priority: 'High',
      },
      {
        task: 'Formulate zero-trust IAM policy specifications and secret rotation rules',
        owner: 'Sneha Reddy',
        priority: 'High',
      },
      {
        task: 'Define customer journey maps and pilot MVP validation criteria',
        owner: 'Pooja Verma',
        priority: 'Medium',
      },
      {
        task: 'Benchmark LLM proxy semantic caching and p99 latency targets',
        owner: 'Dr. Aarav Kapoor',
        priority: 'Medium',
      },
    ],
    generatedAt: new Date(),
  };

  return summary;
}

module.exports = {
  generateCallTurn,
  generateCallSummary,
};
