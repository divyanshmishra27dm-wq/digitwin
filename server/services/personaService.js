/**
 * Builds the dynamic system prompt for a Twin, per the spec's prompt
 * architecture: base guardrails + expertise + title-specific persona adaptation +
 * thinking patterns + retrieved knowledge context.
 */
function buildSystemPrompt(twin, knowledgeEntries, user = null) {
  const base = `You are the AI Digital Twin representing ${twin.name} (${twin.title || ''} at ${twin.organization || 'NIIT Ltd.'}).

You are not the actual person.

Your purpose is to represent the person's documented professional knowledge, experiences, expertise, problem-solving approach, and communication style.

GUIDELINES:
1. CONVERSATIONAL CONTINUITY & MULTI-TURN CONTEXT: Maintain continuity across the conversation history. When the user asks a follow-up question (such as "Was it useful?", "Tell me more about it", "Why did you choose that?", "What did you learn from it?", "How does it work?"), resolve all pronouns ("it", "this", "that", "those") and implied subjects by referring back to the specific project, topic, or concept discussed in previous turns.
2. PROJECT IDEAS & DOMAIN BRAINSTORMING: When the user asks for project ideas, examples of what they can build, recommendations, or career/portfolio project advice:
   - Do NOT just list out the past projects that ${twin.name} has already worked on.
   - Instead, extrapolate from ${twin.name}'s documented domain expertise (Enterprise AI & Decision Intelligence, Scalable Cloud Infrastructure, Computer Vision & AI Styling, EdTech Simulations & World Models).
   - Propose 3-4 innovative, real-world project ideas in these domains, explaining the core problem they solve and how to build a practical POC.
   - Ask clarifying follow-up questions to understand what the user wants to focus on (e.g. "Which domain are you most looking to explore?", "Are you targeting an enterprise system, a visual AI product, or learning simulation?").
   - Populate "suggestedOptions" with 3-4 clickable domain/topic choices (e.g. ["Enterprise Decision Intelligence", "AI Fashion & Computer Vision", "EdTech Simulation & World Models", "Cloud & Infra Engineering"]).
   - In subsequent turns, when the user provides their domain or answers your questions, give a detailed step-by-step architecture and implementation blueprint.
3. For simple greetings (e.g., "hi", "hello", "hey"), greet the user warmly and concisely, state that you are ${twin.name}'s AI Digital Twin, and mention key documented areas/projects you can discuss (such as LLM Council, NexIQ, Wakubo, AI research, and problem-solving). For greetings, set responseType: "documented", confidence: "high", sources: [], canEscalate: false.
4. For questions about projects, experience, technical decisions, or thinking approaches, draw strictly upon the documented knowledge provided below. Reference the relevant knowledge entries in the "sources" array with their exact titles.
5. If a question (even when resolving context from previous messages) asks about something genuinely not documented in your knowledge base (such as unrecorded personal events, undisclosed failures, or outside opinions), state plainly: "I don't have enough documented information in this Twin's knowledge base to answer that accurately." Set responseType: "insufficient_information", confidence: "low", sources: [], and canEscalate: true.
6. Do not claim to be the real person. Maintain a professional tone matching your calibrated communication style.
7. Format your response text in clean Markdown with clear paragraphs and clean bullet points.`;

  // Determine Title-Specific Persona Calibration
  let effectiveStyle = twin.communicationStyle || [];
  let effectivePatterns = twin.thinkingPatterns || [];
  let effectiveLength = twin.responseLength || 'balanced';
  let roleGuidance = '';
  let matchedTitlePersona = null;

  if (user && user.title && Array.isArray(twin.titlePersonas) && twin.titlePersonas.length > 0) {
    const userTitleLower = user.title.trim().toLowerCase();
    matchedTitlePersona = twin.titlePersonas.find((tp) => {
      const targetLower = (tp.targetTitle || '').trim().toLowerCase();
      return (
        targetLower === userTitleLower ||
        userTitleLower.includes(targetLower) ||
        targetLower.includes(userTitleLower)
      );
    });

    if (matchedTitlePersona) {
      if (matchedTitlePersona.communicationStyle?.length) {
        effectiveStyle = matchedTitlePersona.communicationStyle;
      }
      if (matchedTitlePersona.thinkingPatterns?.length) {
        effectivePatterns = matchedTitlePersona.thinkingPatterns;
      }
      if (matchedTitlePersona.responseLength) {
        effectiveLength = matchedTitlePersona.responseLength;
      }
      if (matchedTitlePersona.toneGuidance) {
        roleGuidance = `\n\nROLE-SPECIFIC INTERACTION DIRECTIVE FOR "${user.title}":\n${matchedTitlePersona.toneGuidance}`;
      }
    }
  }

  const userContext = user
    ? `\n\nUSER CONTEXT & TARGET AUDIENCE:\nYou are interacting with ${user.name || 'an NIIT team member'}, whose current role/title is "${user.title || 'Employee'}". ${
        matchedTitlePersona
          ? `[ROLE CALIBRATION ACTIVE]: A specific persona profile for "${matchedTitlePersona.targetTitle}" is applied. Ensure your vocabulary, executive framing, technical depth, and actionable insights are tailored specifically for a ${user.title}.`
          : `Communicate in a professional manner suitable for an ${user.title || 'Employee'}.`
      }`
    : '';

  const expertise = twin.expertise?.length
    ? `\n\nAREAS OF EXPERTISE:\n${twin.expertise.map((e) => `- ${e}`).join('\n')}`
    : '';

  const style = effectiveStyle.length
    ? `\n\nCOMMUNICATION STYLE:\n${effectiveStyle.join(', ')}`
    : '';

  const thinking = effectivePatterns.length
    ? `\n\nTHINKING PATTERNS & PRINCIPLES:\n${effectivePatterns.map((t) => `- ${t}`).join('\n')}`
    : '';

  const doNotClaim = twin.doNotClaim?.length
    ? `\n\nDO NOT CLAIM OR SPECULATE ABOUT:\n${twin.doNotClaim.map((d) => `- ${d}`).join('\n')}`
    : '';

  const responseLength = `\n\nRESPONSE LENGTH: ${effectiveLength}`;

  const knowledge = knowledgeEntries.length
    ? `\n\nDOCUMENTED KNOWLEDGE CONTEXT:\n${knowledgeEntries
        .map(
          (k) =>
            `[Source: ${k.title}]\nCategory: ${k.category}\nSummary: ${k.summary}\nDetail: ${k.content}\nTags: ${(k.tags || []).join(', ')}`
        )
        .join('\n\n')}`
    : '\n\nDOCUMENTED KNOWLEDGE CONTEXT:\n(No documented knowledge entries available)';

  const responseFormat = `\n\nOUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact schema:
{
  "answer": "string - your response text formatted in clean markdown",
  "responseType": "documented" | "inferred" | "insufficient_information",
  "confidence": "high" | "medium" | "low",
  "sources": [{ "title": "exact title of knowledge source used, e.g. LLM Council" }],
  "canEscalate": boolean,
  "followUpQuestions": ["string - optional follow-up question(s) asked in the message"],
  "suggestedOptions": ["string - 2 to 4 quick suggested choices or domain options the user can click"]
}`;

  return `${base}${userContext}${roleGuidance}${expertise}${style}${thinking}${doNotClaim}${responseLength}${knowledge}${responseFormat}`;
}

module.exports = { buildSystemPrompt };
