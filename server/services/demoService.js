/**
 * DEMO MODE — used automatically whenever LITELLM_API_KEY is not set (or on fallback),
 * so the whole product works and demos convincingly with zero external
 * dependencies. Canned answers are written in Divyansh's documented
 * voice/content per the seed knowledge base. Anything outside this set
 * correctly returns "insufficient information" rather than a guess.
 */

const DEMO_QA = [
  {
    keywords: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'who are you', 'introduce'],
    answer:
      "Hi! I'm the AI Digital Twin representing Divyansh Mishra, Leadership Trainee at NIIT Ltd. You can ask me about my documented experiences across enterprise AI (like the LLM Council), software engineering & infrastructure (NexIQ), AI fashion tech (Wakubo), EdTech research, and my approach to problem-solving.",
    sources: [],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['what all projects i can work', 'what projects can i work', 'project ideas', 'project suggestions', 'what can i build', 'examples of what all projects', 'ideas on similar domains', 'suggest some projects', 'ideas for project', 'what projects should i'],
    answer:
      "Drawing from my core focus areas, here are high-impact project ideas across several key domains that you could build:\n\n1. **Enterprise Decision Intelligence & LLM Councils** — Build a multi-model consensus system that ingests quarterly business reports, runs variance analysis, and synthesizes strategic takeaways with source attribution.\n2. **Production-Ready Enterprise Cloud Infrastructure** — Architect a secure microservices platform with containerized Docker services, Keycloak SSO identity management, MongoDB data layer, and automated CI/CD deployment.\n3. **AI Fashion Stylist & Virtual Try-On** — Develop a computer vision-driven styling assistant that generates personalized outfit recommendations and virtual garment fitting using image segmentation.\n4. **EdTech World Models & Decision Simulation** — Build an education simulator that models student learning trajectories and tests curriculum decisions before live rollout.\n\nWhich domain or problem area are you most interested in exploring?",
    sources: ['LLM Council', 'NexIQ', 'Wakubo', 'World Model / EdTech', 'Problem Solving'],
    responseType: 'inferred',
    confidence: 'high',
    followUpQuestions: ['Which domain or problem area are you most interested in exploring?'],
    suggestedOptions: [
      'Enterprise Decision Intelligence',
      'AI Fashion & Computer Vision',
      'EdTech Simulation & World Models',
      'Cloud & Infrastructure Engineering',
    ],
  },
  {
    keywords: ['project', 'projects', 'worked on', 'work on', 'background', 'portfolio', 'experience', 'what have you built'],
    answer:
      "I've worked across a few distinct areas: the LLM Council, an internal enterprise-AI initiative for turning MBR/QBR data into strategic insight; NexIQ, an enterprise application I helped engineer end-to-end including its deployment infrastructure; Wakubo, an AI fashion-tech venture built around a virtual stylist and try-on experience; and some early-stage World Model / EdTech thinking about simulating product and learning decisions. Ask me about any one of these and I can go deeper.",
    sources: ['LLM Council', 'NexIQ', 'Wakubo', 'World Model / EdTech', 'AI Research'],
    responseType: 'documented',
    confidence: 'high',
    suggestedOptions: ['LLM Council', 'NexIQ Infrastructure', 'Wakubo Fashion Tech', 'EdTech World Models'],
  },
  {
    keywords: ['llm council', 'mbr', 'qbr'],
    answer:
      "The LLM Council was built to help business leaders work with MBR and QBR information more intelligently — surfacing patterns, cross-business-unit insight and variances, rather than just reproducing what was already in the decks.",
    sources: ['LLM Council'],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['summariz', 'summary tool', 'just a summar', 'why wasn\'t', 'why was not', 'summarization'],
    answer:
      "It wasn't built as a summarizer because the decks and the underlying structured financial data already existed — summarizing them again wouldn't have added anything. The actual gap was judgment: helping leaders see cross-BU patterns, meaningful variances and where those pointed strategically, which is a different job from compressing text.",
    sources: ['LLM Council'],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['nexiq', 'infrastructure', 'docker', 'keycloak', 'mongodb', 'aws', 'azure'],
    answer:
      "NexIQ was an enterprise application I worked on end-to-end — the engineering side covered containerising the app with Docker, integrating Keycloak for identity, and getting it running in production on AWS/Azure infrastructure with MongoDB as the data layer.",
    sources: ['NexIQ'],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['wakubo', 'fashion', 'try-on', 'stylist'],
    answer:
      "Wakubo was an AI fashion-technology venture. The core idea was an AI fashion stylist that gave people personalised recommendations, using computer vision to support a virtual try-on experience.",
    sources: ['Wakubo'],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['learn from wakubo', 'wakubo learn', 'learned from wakubo', 'wakubo teach'],
    answer:
      "That's a fair question, but I don't have a specific documented lesson from Wakubo written down in this Twin's knowledge base yet — I'd rather say that plainly than invent a tidy takeaway.",
    sources: [],
    responseType: 'insufficient_information',
    confidence: 'low',
  },
  {
    keywords: ['failure', 'fail', 'mistake', 'biggest failure', 'regret'],
    answer:
      "I don't have documented information about failures or unrecorded events at NIIT in this Twin's knowledge base. For questions requiring personal reflection not documented here, please reach out to Divyansh directly via human escalation.",
    sources: [],
    responseType: 'insufficient_information',
    confidence: 'low',
  },
  {
    keywords: ['new ai problem', 'approach a', 'how do you approach', 'approach to building a poc', 'poc', 'problem solving', 'decide whether'],
    answer:
      "I start with the problem, not the technology — understanding what data already exists before deciding whether or what to build. From there I try to connect the technical option to real business value early, get a practical proof-of-concept in front of people fast, and think about how it would actually get deployed rather than treating that as an afterthought.",
    sources: ['Problem Solving'],
    responseType: 'documented',
    confidence: 'high',
  },
  {
    keywords: ['world model', 'edtech', 'simulation'],
    answer:
      "The World Model / EdTech idea was about simulating education and product decisions faster, using learner and market data, so decisions that would normally take a long feedback loop could be reasoned about sooner.",
    sources: ['World Model / EdTech'],
    responseType: 'documented',
    confidence: 'medium',
  },
  {
    keywords: ['research', 'generative ai', 'computer vision'],
    answer:
      "My research activities focus on Generative AI, computer vision, and educational technology experimentation — specifically applying rapid prototyping and practical AI evaluations to real-world workflows.",
    sources: ['AI Research'],
    responseType: 'documented',
    confidence: 'high',
  },
];

const FALLBACK_ANSWER =
  "I don't have enough documented information in this Twin's knowledge base to answer that accurately.";

function getDemoResponse(question, knowledgeEntries = [], history = []) {
  const q = question.toLowerCase();

  // If question is a short follow-up / pronoun question (e.g. "was it useful?", "tell me more"), look up the last discussed topic
  let searchContext = q;
  const isFollowUp = q.length < 35 || ['it', 'that', 'this', 'useful', 'more', 'why', 'how', 'result', 'outcome'].some((w) => q.includes(w));
  if (isFollowUp && Array.isArray(history) && history.length > 0) {
    const lastTurns = [...history].reverse().slice(0, 3);
    const contextText = lastTurns.map((m) => (m.content || '').toLowerCase()).join(' ');
    searchContext = `${q} ${contextText}`;
  }

  // First check if any dynamically retrieved knowledge entries match
  if (Array.isArray(knowledgeEntries) && knowledgeEntries.length > 0) {
    const matchedEntry = knowledgeEntries.find((k) => {
      const titleLower = (k.title || '').toLowerCase();
      const tagsLower = (k.tags || []).join(' ').toLowerCase();
      return (
        searchContext.includes(titleLower) ||
        (k.tags || []).some((tag) => searchContext.includes(tag.toLowerCase()))
      );
    });

    if (matchedEntry) {
      return {
        answer: matchedEntry.content,
        responseType: 'documented',
        confidence: 'high',
        sources: [{ title: matchedEntry.title }],
        canEscalate: false,
      };
    }
  }

  const match = DEMO_QA.find((qa) => qa.keywords.some((k) => searchContext.includes(k)));

  if (!match) {
    return {
      answer: FALLBACK_ANSWER,
      responseType: 'insufficient_information',
      confidence: 'low',
      sources: [],
      canEscalate: true,
    };
  }

  return {
    answer: match.answer,
    responseType: match.responseType,
    confidence: match.confidence,
    sources: match.sources.map((title) => ({ title })),
    canEscalate: match.responseType !== 'documented' || match.confidence === 'low',
    suggestedOptions: match.suggestedOptions || [],
    followUpQuestions: match.followUpQuestions || [],
  };
}

module.exports = { getDemoResponse, FALLBACK_ANSWER };

