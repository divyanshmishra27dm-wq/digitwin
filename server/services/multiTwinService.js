const axios = require('axios');
const Knowledge = require('../models/Knowledge');
const { retrieveRelevantKnowledge } = require('./retrievalService');
const { isDemoMode } = require('./aiService');

/**
 * Multi-Twin Roundtable AI Orchestration Service
 */

/**
 * Generate a single turn for a designated speaking twin in a roundtable session
 */
async function generateTwinRoundtableTurn({
  roundtable,
  speakingTwin,
  allTwins = [],
  user = null,
  userInstruction = null,
}) {
  const knowledgeEntries = await retrieveRelevantKnowledge(
    speakingTwin._id,
    `${roundtable.topic} ${roundtable.title}`,
    roundtable.turns.slice(-6).map((t) => ({ role: t.speakerRole === 'user' ? 'user' : 'twin', content: t.content }))
  );

  if (isDemoMode()) {
    return generateDemoRoundtableTurn({
      roundtable,
      speakingTwin,
      allTwins,
      user,
      knowledgeEntries,
      userInstruction,
    });
  }

  const previousTurns = roundtable.turns || [];
  const twinTurns = previousTurns.filter((t) => t.speakerRole === 'twin');
  const isOpeningTurn = twinTurns.length === 0;
  const spokenTwinNames = Array.from(new Set(twinTurns.map((t) => t.speakerName)));

  const systemPrompt = buildRoundtableSystemPrompt({
    speakingTwin,
    allTwins,
    roundtable,
    knowledgeEntries,
    user,
    isOpeningTurn,
    spokenTwinNames,
  });

  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add previous turns context
  for (const turn of previousTurns.slice(-10)) {
    if (turn.speakerRole === 'user') {
      messages.push({
        role: 'user',
        content: `[User Prompt / Moderator]: ${turn.content}`,
      });
    } else {
      messages.push({
        role: 'assistant',
        content: `[${turn.speakerName} (${turn.speakerTitle || 'Participant'})]: ${turn.content}`,
      });
    }
  }

  // Current turn trigger
  if (userInstruction) {
    messages.push({
      role: 'user',
      content: `[Moderator Directive for ${speakingTwin.name}]: ${userInstruction}. Please share your perspective on the topic "${roundtable.topic}".`,
    });
  } else if (isOpeningTurn) {
    messages.push({
      role: 'user',
      content: `[Roundtable Opening Turn]: You are the FIRST speaker to open the discussion on "${roundtable.topic}". Lay out your initial analysis and proposal. Remember: No other colleagues have spoken yet, so do not claim they have already said anything.`,
    });
  } else {
    messages.push({
      role: 'user',
      content: `[Roundtable Progression - Turn #${previousTurns.length + 1}]: It is now ${speakingTwin.name}'s turn to speak on "${roundtable.topic}". Build upon what ${spokenTwinNames.join(', ')} have stated in the transcript above and share your domain perspective.`,
    });
  }

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

    return {
      content: parsed.answer || parsed.content || `From my perspective in ${speakingTwin.dept || 'Engineering'}, we should approach this methodically.`,
      perspective: parsed.perspective || `${speakingTwin.dept || 'Domain'} Strategy & Implementation`,
      addressedTo: Array.isArray(parsed.addressedTo) ? parsed.addressedTo : [],
      keyTakeaway: parsed.keyTakeaway || '',
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch (err) {
    console.error('[multiTwinService] LLM call failed, falling back to simulated turn:', err.message);
    return generateDemoRoundtableTurn({
      roundtable,
      speakingTwin,
      allTwins,
      user,
      knowledgeEntries,
      userInstruction,
    });
  }
}

/**
 * Construct system prompt for a twin participating in a multi-twin roundtable
 */
function buildRoundtableSystemPrompt({
  speakingTwin,
  allTwins,
  roundtable,
  knowledgeEntries,
  user,
  isOpeningTurn = false,
  spokenTwinNames = [],
}) {
  const otherTwins = allTwins.filter((t) => t._id.toString() !== speakingTwin._id.toString());
  const otherNames = otherTwins.map((t) => `${t.name} (${t.title}, ${t.dept || 'NIIT'})`).join(', ');

  const expertise = (speakingTwin.expertise || []).join(', ');
  const thinking = (speakingTwin.thinkingPatterns || []).join('; ');
  const style = (speakingTwin.communicationStyle || []).join(', ');

  const turnDirective = isOpeningTurn
    ? `CURRENT CONVERSATION STATE:
YOU ARE THE OPENING SPEAKER (Turn #1). NO OTHER TWINS HAVE SPOKEN YET.
- STRICT RULE: Do NOT say "I agree with @[Colleague]" or "@[Colleague] mentioned" or claim that any colleague has said anything, because NO ONE has spoken yet!
- Introduce your opening vision and domain framework. You may invite colleagues by name at the end (e.g., "I look forward to hearing Dr. Aarav's thoughts on distributed caching").`
    : `CURRENT CONVERSATION STATE:
Colleagues who have actually spoken in previous turns: ${spokenTwinNames.join(', ') || 'None'}.
- You may address, agree with, or debate the points that these specific speakers actually made in the transcript above.
- Do NOT attribute unsaid opinions to colleagues who have not spoken yet.`;

  return `You are the AI Digital Twin of ${speakingTwin.name} (${speakingTwin.title || 'Specialist'} in the ${speakingTwin.dept || 'Engineering'} Department at ${speakingTwin.organization || 'NIIT Ltd.'}).

YOU ARE PARTICIPATING IN AN INTERACTIVE MULTI-AGENT ROUNDTABLE / SUMMIT WITH YOUR COLLEAGUES.

ROUNDTABLE DETAILS:
- Topic / Goal: "${roundtable.topic}"
- Discussion Mode: ${roundtable.discussionMode || 'Problem Solving'}
- Session Title: "${roundtable.title}"
- Participating Colleagues in the room: ${otherNames || 'None'}
${user ? `- Roundtable Initiator / Moderator: ${user.name} (${user.title || 'Team Member'})` : ''}

${turnDirective}

YOUR PERSONA & PRINCIPLES:
- Department: ${speakingTwin.dept || 'Engineering'}
- Areas of Expertise: ${expertise || 'General'}
- Communication Style: ${style || 'Professional and direct'}
- Core Thinking Patterns & Working Philosophy: ${thinking || 'Practical problem solving'}

INSTRUCTIONS FOR ROUNDTABLE CONVERSATION:
1. Speak authentically as ${speakingTwin.name}'s digital twin.
2. Structure your reply cleanly using Markdown (paragraphs, bullet points).
3. If there are trade-offs (e.g. speed vs security, MVP vs enterprise scaling, user experience vs technical debt), address them constructively from your perspective.
4. Provide actionable, practical insights.
5. Do NOT claim to be the real human person, but represent their authentic mindset and documented approach accurately.

DOCUMENTED KNOWLEDGE:
${knowledgeEntries.map((k) => `[${k.title}]: ${k.summary} - ${k.content}`).join('\n\n') || '(Use baseline domain expertise)'}

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "answer": "string - your in-character markdown speech for this turn (2-4 concise paragraphs)",
  "perspective": "string - short title of your angle, e.g. 'Cloud Architecture & Rapid POC' or 'Zero-Trust Security & IAM'",
  "addressedTo": ["string - name(s) of colleagues you directly addressed, invited, or referenced"],
  "keyTakeaway": "string - one crisp sentence summarizing your core contribution in this turn",
  "sources": [{ "title": "documented source title if used" }]
}`;
}

/**
 * Dynamic offline simulation engine for multi-twin collaborative discussions
 */
function generateDemoRoundtableTurn({ roundtable, speakingTwin, allTwins, user, knowledgeEntries, userInstruction }) {
  const turns = roundtable.turns || [];
  const turnIndex = turns.length;
  const otherTwins = allTwins.filter((t) => t._id.toString() !== speakingTwin._id.toString());
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  const topicLower = (roundtable.topic || '').toLowerCase();
  const name = speakingTwin.name;
  const isDivyansh = name.toLowerCase().includes('divyansh');
  const isPooja = name.toLowerCase().includes('pooja');
  const isSneha = name.toLowerCase().includes('sneha');

  let answer = '';
  let perspective = '';
  let addressedTo = [];
  let keyTakeaway = '';
  let sources = [];

  // Generate perspective according to persona
  if (isDivyansh) {
    perspective = 'AI Systems Architecture & Practical POC';
    sources = [{ title: 'Problem Solving' }, { title: 'NexIQ' }, { title: 'LLM Council' }];
    
    if (turnIndex === 0 || !lastTurn) {
      answer = `To tackle **"${roundtable.topic}"**, I always start by grounding the solution in existing data and real operational constraints before jumping to conclusions. 

From an engineering and AI perspective, my recommendation is to build a high-velocity Proof of Concept (POC) first. We should establish a containerized microservice pipeline using Docker, integrate a modular AI orchestration layer (similar to the multi-agent consensus approach we used in the LLM Council), and store state reliably in MongoDB.

By decoupling the ingestion from the inference engines, we can test user interactions rapidly without locking ourselves into a single provider. Let's make sure we define how this deploys into production early on rather than treating deployment as an afterthought.`;
      keyTakeaway = 'Establish a modular containerized POC with decoupled AI orchestration and early deployment planning.';
    } else {
      const lastSpeaker = lastTurn.speakerName;
      addressedTo = [lastSpeaker];
      answer = `I completely align with ${lastSpeaker}'s emphasis, especially regarding how this impacts our execution velocity. Building on what ${lastSpeaker} mentioned:

1. **Practical Implementation**: Instead of building a monolithic pipeline, we can implement modular services with clear API boundaries. When we built NexIQ, containerizing services with Docker and keeping data layers cleanly decoupled in MongoDB allowed us to iterate much faster.
2. **AI & Decision Intelligence**: If this involves complex multi-variable reasoning, we can adopt the Council pattern we explored in the LLM Council—evaluating outputs across specialized prompts to ensure accuracy and high confidence before surfacing recommendations to users.
3. **Deployment Feasibility**: We should target AWS/Azure deployment from Day 1 so performance benchmarks reflect real production conditions.

What are the specific risk vectors or user friction points we should safeguard against first?`;
      keyTakeaway = 'Incorporate modular API boundaries, multi-prompt consensus validation, and early production benchmarking.';
    }
  } else if (isPooja) {
    perspective = 'Product Strategy & User Journey Viability';
    sources = [];

    if (turnIndex === 0 || !lastTurn) {
      answer = `Looking at **"${roundtable.topic}"** from a Product and Strategy viewpoint, our primary lens must be the end-user journey and measurable customer value.

Before engineering heavy infrastructure, we need to clearly define:
1. **Core User Pain Point**: What exact bottleneck or friction are we eliminating for enterprise users?
2. **MVP Scope & Success Metrics**: What is the minimum feature set that delivers tangible ROI? We should measure task completion time, user adoption rate, and decision confidence.
3. **Feedback Loops**: How quickly can we place this in front of pilot users to test product assumptions?

I want to ensure we don't over-engineer features that users won't utilize. Let's design a lean, frictionless user workflow first.`;
      keyTakeaway = 'Define customer pain points, MVP validation metrics, and rapid pilot feedback loops.';
    } else {
      const divyansh = allTwins.find((t) => t.name.includes('Divyansh'));
      const sneha = allTwins.find((t) => t.name.includes('Sneha'));
      const refName = divyansh ? divyansh.name : (lastTurn ? lastTurn.speakerName : 'the team');
      addressedTo = [refName];

      answer = `That makes complete sense from an engineering standpoint, ${refName}. From a Product Management lens, I want to make sure our technical architecture directly maps to user milestones.

Here is how I suggest we phase this from 0 to 1:
- **Phase 1 (MVP Pilot)**: Focus on the top 20% of use cases that deliver 80% of the workflow value. Keep user interfaces intuitive and self-explanatory.
- **Phase 2 (User Feedback & Telemetry)**: Track real user engagement, response satisfaction, and drop-off points before expanding scope.
- **Phase 3 (Enterprise Scale)**: Roll out cross-department workflows once the core value hypothesis is validated.

${sneha ? `@${sneha.name}, how do we balance seamless user onboarding with enterprise compliance and data governance requirements?` : 'How do we ensure user friction is minimized during rollout?'}`;
      keyTakeaway = 'Phase delivery from a lean pilot MVP to telemetry-driven iteration and enterprise rollout.';
    }
  } else if (isSneha) {
    perspective = 'Zero-Trust Security & Data Governance';
    sources = [];

    if (turnIndex === 0 || !lastTurn) {
      answer = `Analyzing **"${roundtable.topic}"** from a Cybersecurity and InfoSec standpoint, we must adopt an "assume breach" mindset from the outset.

To ensure this solution complies with enterprise standards:
1. **Zero-Trust & IAM Boundaries**: All service endpoints and user access must be authenticated via Keycloak or OAuth2 with strict Role-Based Access Control (RBAC).
2. **Data Privacy & LLM Sandboxing**: Sensitive enterprise telemetry and intellectual property must never leak across tenant boundaries or into public training pipelines.
3. **Auditability & Observability**: Every automated decision and data mutation must have an immutable audit trail.

Let's embed security and threat modeling into the design phase rather than patching it post-launch.`;
      keyTakeaway = 'Enforce Zero-Trust architecture, Keycloak IAM boundaries, and strict data privacy isolation.';
    } else {
      const pooja = allTwins.find((t) => t.name.includes('Pooja'));
      const divyansh = allTwins.find((t) => t.name.includes('Divyansh'));
      addressedTo = [pooja ? pooja.name : '', divyansh ? divyansh.name : ''].filter(Boolean);

      answer = `To address ${pooja ? `@${pooja.name}'s point on seamless user onboarding` : 'the workflow requirements'} while keeping ${divyansh ? `@${divyansh.name}'s architecture` : 'the system'} airtight:

1. **Seamless yet Secure Authentication**: We can implement Single Sign-On (SSO) backed by Keycloak with JWT token verification. This provides zero friction for enterprise users while enforcing strict principle-of-least-privilege access.
2. **Data-at-Rest & In-Transit Encryption**: All stored state in MongoDB and vector embeddings must be encrypted (AES-256) with segregated database roles.
3. **Guardrails & Rate Limiting**: Implement API gateway rate limiting and automated prompt sanitization to prevent prompt injection or denial-of-service vulnerabilities.

This gives the product team maximum usability and engineering rapid deployment without compromising our security posture.`;
      keyTakeaway = 'Harmonize SSO user experience with JWT least-privilege enforcement and database encryption.';
    }
  } else if (name.toLowerCase().includes('aarav')) {
    perspective = 'Foundation Model Mesh & Distributed Scale';
    sources = [{ title: 'Enterprise LLM Mesh Architecture' }, { title: 'Autonomous Agent Evaluation Harness' }];

    const divyansh = allTwins.find((t) => t.name.includes('Divyansh'));
    const sneha = allTwins.find((t) => t.name.includes('Sneha'));
    addressedTo = [divyansh ? divyansh.name : '', sneha ? sneha.name : ''].filter(Boolean);

    if (turnIndex === 0 || !lastTurn) {
      answer = `From a Chief AI Architect lens on **"${roundtable.topic}"**, we must architect the foundational layer for horizontal elasticity and strict sub-second latency from day one.

My architectural pillars for this initiative:
1. **Distributed LLM Mesh & Dynamic Routing**: Rather than point-to-point model calls, deploy an enterprise proxy mesh with semantic vector caching in Redis. This reduces inference costs by 45% and ensures p99 response times under 250ms.
2. **Decoupled Reasoning & Storage**: Separate the analytical vector embeddings from transactional state in MongoDB to prevent IO bottlenecks during heavy QBR cycles.
3. **Continuous Evaluation Harness**: Implement synthetic regression benchmarks to detect reasoning drift and verify source attribution before outputs reach leadership.

Let's ensure the core infrastructure handles enterprise concurrent load effortlessly.`;
      keyTakeaway = 'Deploy an Enterprise LLM Mesh with semantic vector caching and continuous regression benchmarks.';
    } else {
      answer = `I strongly support ${divyansh ? `@${divyansh.name}'s modular POC design` : 'the proposed architecture'}, and want to elevate it for enterprise scale:

1. **Semantic Caching Layer**: In addition to containerized microservices in Docker, we should place a Redis-backed semantic vector cache in front of our LLM orchestration. When multiple executives query similar MBR variance metrics, we serve cached embeddings in under 15ms.
2. **Model Routing & Fallback**: Integrate multi-model fallback across frontier models (Claude, GPT-4, Gemini) so downtime from a single provider never blocks business decision pipelines.
3. **Harmonizing with Zero-Trust**: To align with ${sneha ? `@${sneha.name}'s zero-trust IAM directive` : 'security compliance'}, token-level tenant isolation will be embedded directly in the embedding index namespaces.

This creates a system that is blazing fast, cost-efficient, and enterprise-grade.`;
      keyTakeaway = 'Augment microservices with Redis semantic caching, dynamic multi-model routing, and namespace-isolated vector indexes.';
    }
  } else {
    // Custom twin generic dynamic response
    perspective = `${speakingTwin.dept || 'Domain'} Strategy`;
    answer = `Reviewing **"${roundtable.topic}"** through the lens of ${speakingTwin.title} in ${speakingTwin.dept}:

My approach centers on ${speakingTwin.thinkingPatterns?.[0] || 'practical execution and measurable value'}. To ensure we succeed:
- We must align our execution milestones with ${speakingTwin.expertise?.[0] || 'core domain competencies'}.
- Collaborative synchronization between our disciplines is essential to prevent silos.
- Let's establish clear deliverables and test our hypotheses with concrete evidence.

I support moving forward with the outlined framework while monitoring domain performance indicators.`;
    keyTakeaway = `Apply ${speakingTwin.dept} domain best practices to ensure structured and measurable execution.`;
  }

  if (userInstruction) {
    answer = `Regarding the moderator's directive ("*${userInstruction}*"):\n\n${answer}`;
  }

  return {
    content: answer,
    perspective,
    addressedTo,
    keyTakeaway,
    sources,
  };
}

/**
 * Generate an executive consensus and action plan across all participating twins
 */
async function generateRoundtableSummary({ roundtable, allTwins = [] }) {
  const turns = roundtable.turns || [];
  const twinMap = new Map(allTwins.map((t) => [t._id.toString(), t]));

  // Compute perspectives breakdown
  const perspectives = allTwins.map((twin) => {
    const twinTurns = turns.filter((t) => t.twinId && t.twinId.toString() === twin._id.toString());
    const keyPoints = twinTurns.map((t) => t.keyTakeaway).filter(Boolean);

    let summaryText = '';
    if (twin.name.includes('Divyansh')) {
      summaryText = 'Architected a modular POC pipeline with Docker microservices, decoupled AI consensus, and rapid deployment readiness.';
    } else if (twin.name.includes('Pooja')) {
      summaryText = 'Defined user pain points, phased MVP validation roadmap, telemetry tracking, and customer-centric adoption metrics.';
    } else if (twin.name.includes('Sneha')) {
      summaryText = 'Established Zero-Trust IAM boundaries, Keycloak SSO integration, AES-256 data encryption, and prompt sanitization.';
    } else if (twin.name.toLowerCase().includes('aarav')) {
      summaryText = 'Architected high-throughput Enterprise LLM Mesh, Redis semantic vector caching, dynamic multi-model routing, and regression evaluation harnesses.';
    } else {
      summaryText = `Contributed ${twin.dept} domain expertise, emphasizing structured milestones and measurable outcomes.`;
    }

    return {
      twinName: twin.name,
      twinTitle: twin.title || 'Digital Twin',
      summary: summaryText,
      keyPoints: keyPoints.length > 0 ? keyPoints : [summaryText],
    };
  });

  const overview = `The Digital Twin Roundtable convened to formulate an end-to-end strategy for "${roundtable.topic}". Participating experts spanning ${allTwins.map((t) => t.dept).filter(Boolean).join(', ')} collaborated to assess technical feasibility, product roadmap viability, and enterprise security compliance.`;

  const consensus = `The panel reached consensus on a phased execution model that marries rapid technical prototyping with rigorous zero-trust security and user-centric MVP milestones. The team will deliver a containerized Proof of Concept, validate core customer workflows with pilot telemetry, and secure all API endpoints through unified SSO authentication.`;

  const actionPlan = [
    {
      step: 1,
      title: 'Problem Framing & User Journey Definition',
      detail: 'Specify core user pain points, MVP scope boundaries, and measurable ROI indicators.',
      owner: allTwins.find((t) => t.name.includes('Pooja'))?.name || 'Product Team',
      priority: 'High',
    },
    {
      step: 2,
      title: 'Modular POC & AI Architecture Scaffolding',
      detail: 'Build containerized microservices with Docker and MongoDB, implementing decoupled inference logic.',
      owner: allTwins.find((t) => t.name.includes('Divyansh'))?.name || 'Engineering Team',
      priority: 'High',
    },
    {
      step: 3,
      title: 'Foundation LLM Mesh & Semantic Cache Integration',
      detail: 'Deploy Redis semantic caching layer, multi-model fallback mesh, and synthetic evaluation harness.',
      owner: allTwins.find((t) => t.name.toLowerCase().includes('aarav'))?.name || 'AI Architecture',
      priority: 'High',
    },
    {
      step: 4,
      title: 'Zero-Trust Security & IAM Integration',
      detail: 'Configure Keycloak SSO, role-based access control (RBAC), data encryption, and rate limiting.',
      owner: allTwins.find((t) => t.name.includes('Sneha'))?.name || 'Security Architecture',
      priority: 'High',
    },
    {
      step: 5,
      title: 'Pilot Deployment & Telemetry Evaluation',
      detail: 'Deploy to cloud infrastructure, collect user adoption metrics, and iterate rapidly based on feedback.',
      owner: 'Cross-functional Team',
      priority: 'Medium',
    },
  ];

  return {
    overview,
    consensus,
    perspectives,
    actionPlan,
    generatedAt: new Date(),
  };
}

module.exports = {
  generateTwinRoundtableTurn,
  generateRoundtableSummary,
};
