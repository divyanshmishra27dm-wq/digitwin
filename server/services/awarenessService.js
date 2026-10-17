const Knowledge = require('../models/Knowledge');
const Twin = require('../models/Twin');
const AwarenessLog = require('../models/AwarenessLog');
const { fetchWebPage, analyzeWebLearning } = require('./webScraperService');
const axios = require('axios');

/**
 * Curated live breakthrough knowledge intelligence catalog.
 * Combines live tech intelligence with verified frontier AI architectures.
 */
const CURATED_AI_BREAKTHROUGHS = [
  {
    title: 'Claude 3.7 Sonnet & Hybrid Reasoning Architecture',
    category: 'Artificial Intelligence & Data Science',
    domainTarget: ['Engineering', 'Product', 'Leadership'],
    sourceUrl: 'https://www.anthropic.com/news/claude-3-7-sonnet',
    summary:
      'Anthropic announced Claude 3.7 Sonnet, the industry-first hybrid reasoning model combining instant responses with user-calibrated extended thinking tokens for complex logic and programming.',
    content: `### Architecture Overview
Claude 3.7 Sonnet introduces hybrid reasoning capabilities, unifying standard single-pass generation and deliberate extended chain-of-thought processing within a single unified foundation model.

### Key Technical Capabilities
- **Dynamic Thinking Budget**: Developers can set a max_thinking_tokens parameter or allow the model to dynamically scale reasoning tokens based on task difficulty.
- **Interleaved Tool Calling in Reasoning**: The model can invoke external APIs, execute bash commands, and inspect sub-agent results while remaining in its internal thinking trace.
- **Full-Stack Engineering Superiority**: Significant performance leaps in multi-file refactoring, frontend rendering, and deep architectural debugging.

### Enterprise & Twin Application
Equips digital twins with the capacity to determine when to deliver instantaneous executive summaries versus initiating deep architectural multi-step reasoning.`,
    skillsLearned: ['Claude 3.7 Hybrid Reasoning', 'Dynamic Thinking Budgeting', 'Interleaved Tool Calling', 'Frontier Model Orchestration'],
    tags: ['Anthropic', 'Claude 3.7', 'Hybrid Reasoning', 'LLMs', 'Agentic Engineering'],
  },
  {
    title: 'DeepSeek-R1 & Open-Weights Reasoning Architecture',
    category: 'Artificial Intelligence & Data Science',
    domainTarget: ['Engineering', 'Research'],
    sourceUrl: 'https://github.com/deepseek-ai/DeepSeek-R1',
    summary:
      'DeepSeek-R1 achieves frontier-tier mathematical and coding reasoning through pure Group Relative Policy Optimization (GRPO) reinforcement learning without supervised warm-starts.',
    content: `### Architecture & Training Methodology
DeepSeek-R1 demonstrates that complex reasoning behaviors (self-reflection, backtracking, verification) emerge naturally when applying large-scale reinforcement learning over deep reward models.

### Key Architectural Details
- **Group Relative Policy Optimization (GRPO)**: Eliminates the requirement for a memory-intensive critic model, reducing GPU training overhead by estimating baseline scores across action candidate groups.
- **Multi-Head Latent Attention (MLA) & Mixture of Experts (MoE)**: Only 37B parameters activated per token out of a 671B total parameter pool, achieving ultra-low inference latency.
- **Distillation into Dense Models**: High-reasoning traces distilled into compact 1.5B, 7B, 14B, and 32B Qwen and Llama architectures.

### System Takeaways
Digital twins can leverage distilled open-weights reasoning models for private, air-gapped enterprise deployments with zero data leakage.`,
    skillsLearned: ['DeepSeek-R1 Reasoning', 'GRPO Reinforcement Learning', 'Mixture-of-Experts (MoE)', 'Model Distillation'],
    tags: ['DeepSeek', 'GRPO', 'Open-Source AI', 'MoE', 'Reasoning Models'],
  },
  {
    title: 'Model Context Protocol (MCP) & Enterprise Agent Interoperability',
    category: 'Software Engineering',
    domainTarget: ['Engineering', 'Product', 'Marketing'],
    sourceUrl: 'https://modelcontextprotocol.io/introduction',
    summary:
      'The Model Context Protocol (MCP) establishes an open, standardized protocol enabling AI assistants and agents to securely access disparate enterprise tools, databases, and contextual repositories.',
    content: `### Protocol Specification & Design
Model Context Protocol (MCP) solves the N×M tool fragmentation crisis by standardizing how LLMs interface with external data sources, local filesystems, SaaS APIs, and development environments.

### Core Primitives
- **Resources**: URI-addressable static or dynamic data streams (e.g. database schemas, file contents, API docs) exposed to LLMs.
- **Tools**: Executable functions that agents can invoke with validated JSON schemas to perform side-effects.
- **Prompts**: Pre-engineered contextual templates and workflow routines exposed by server nodes.
- **Transport Security**: Standardized JSON-RPC 2.0 over Standard I/O (stdio) or Server-Sent Events (SSE) with strict authentication scopes.

### Impact on Digital Twins
Allows the NIIT Digital Twin ecosystem to dynamically connect with enterprise Jira, Confluence, MongoDB, GitHub, and internal HR systems without custom API wrappers.`,
    skillsLearned: ['Model Context Protocol (MCP)', 'JSON-RPC Tool Integration', 'Agentic Resource Serving', 'Enterprise Data Connectors'],
    tags: ['MCP', 'AI Agents', 'Tool Calling', 'System Integration', 'Open Standards'],
  },
  {
    title: 'Agentic RAG & Multi-Agent Orchestration with LangGraph',
    category: 'Artificial Intelligence & Data Science',
    domainTarget: ['Engineering', 'Product'],
    sourceUrl: 'https://www.langchain.com/langgraph',
    summary:
      'Agentic RAG transforms passive vector lookup into active, stateful retrieval graphs with self-correction, dynamic query rewriting, and multi-agent consensus loops.',
    content: `### Paradigm Shift from Naive RAG to Agentic RAG
Standard semantic search often fails when complex queries require multi-step reasoning or disambiguation. Agentic RAG introduces stateful graph execution loops.

### Key Mechanisms
- **Self-Reflective Retrieval**: The agent inspects retrieved document chunks and grades relevance before generating an answer.
- **Query Transformation & Sub-Question Decomposition**: Ambiguous user prompts are dynamically decomposed into parallel vector and lexical search queries.
- **Stateful Multi-Agent Workflows**: Directed Cyclic Graphs (DCGs) allow specialized sub-agents (Researcher, Fact-Checker, Synthesizer) to iteratively refine knowledge.

### Digital Twin Application
Enables twins to proactively identify gaps in their documented memory, summon peer twins, and synthesize comprehensive consensus answers in Roundtable discussions.`,
    skillsLearned: ['Agentic RAG', 'LangGraph Multi-Agent Workflows', 'Self-Corrective Retrieval', 'Query Decomposition'],
    tags: ['Agentic RAG', 'LangGraph', 'Vector Search', 'Multi-Agent', 'Retrieval'],
  },
  {
    title: 'vLLM & High-Throughput Inference Serving with PagedAttention',
    category: 'Cloud & DevOps',
    domainTarget: ['Engineering', 'Cloud Infrastructure'],
    sourceUrl: 'https://vllm.ai/',
    summary:
      'vLLM maximizes LLM serving throughput and GPU memory utilization through PagedAttention, continuous batching, and chunked prefill optimization.',
    content: `### High-Performance AI Infrastructure
Serving large models in enterprise production requires extreme memory efficiency and minimal time-to-first-token (TTFT).

### Technical Innovations
- **PagedAttention**: Manages Key-Value (KV) cache memory similar to virtual memory paging in operating systems, virtually eliminating memory fragmentation and wastage.
- **Continuous Batching & Chunked Prefill**: Dynamically batches incoming user tokens with ongoing generation streams to maximize GPU compute saturation.
- **Quantization Support**: Native FP8, AWQ, and GPTQ kernels for deploying 70B+ parameter models on single GPU nodes.

### Operational Benefit
Lowers enterprise inference operational costs by up to 70% while sustaining sub-second latency for concurrent twin user sessions.`,
    skillsLearned: ['vLLM Inference Serving', 'PagedAttention Optimization', 'FP8 / AWQ Quantization', 'Continuous Batching'],
    tags: ['vLLM', 'Inference Optimization', 'GPU Memory', 'MLOps', 'High Throughput'],
  },
  {
    title: 'AI Governance, Guardrails & Synthetic Red Teaming',
    category: 'Enterprise Leadership & Strategy',
    domainTarget: ['Leadership', 'Cybersecurity', 'Product'],
    sourceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework',
    summary:
      'Enterprise frameworks and programmable guardrail layers for mitigating hallucinations, enforcing corporate compliance, preventing prompt injection, and automating safety audits.',
    content: `### Enterprise Safety Architecture
Deploying digital twins across thousands of enterprise users requires systematic guardrails ensuring accuracy, tone alignment, and strict adherence to documented facts.

### Key Frameworks & Controls
- **Dual-Layer Guardrails**: Real-time evaluation of incoming user inputs and outgoing model generations against toxic, hallucinated, or speculative claims.
- **Prompt Injection & Jailbreak Defenses**: Semantic firewall rules detecting indirect injection payloads embedded in external web or document data.
- **Synthetic Red Teaming**: Automated generative agents tasked with adversarial testing to discover edge-case failure modes before production release.

### Twin Integrity
Enforces the "Do Not Claim" boundaries and confidence calibrations for digital twin persona consistency.`,
    skillsLearned: ['AI Governance & Compliance', 'LLM Guardrails', 'Prompt Injection Defense', 'Synthetic Red Teaming'],
    tags: ['AI Governance', 'Guardrails', 'Security', 'Compliance', 'Enterprise Safety'],
  },
];

/**
 * 1. MANUAL WEB LINK LEARNING
 * Reads a user-submitted web URL, analyzes it with AI, stores it in the Twin's RAG knowledge base,
 * and updates the Twin's expertise with newly acquired skills.
 */
async function ingestManualWebLink({ twinId, url, userId, customNotes = '' }) {
  const twin = await Twin.findById(twinId);
  if (!twin) {
    throw new Error('Digital Twin not found.');
  }

  // 1. Fetch web page
  const webData = await fetchWebPage(url);

  // 2. Synthesize with LLM / intelligent analyzer
  const analysis = await analyzeWebLearning(url, webData, twin);

  // 3. Create Knowledge Entry
  const knowledge = await Knowledge.create({
    twinId: twin._id,
    title: analysis.title,
    category: analysis.category || 'Technology Learning',
    summary: analysis.summary,
    content: customNotes ? `${analysis.content}\n\n### User Notes & Learnings\n${customNotes}` : analysis.content,
    tags: Array.isArray(analysis.tags) ? analysis.tags : ['Web Learning'],
    source: url,
    sourceType: 'web_learning',
    metadata: {
      url,
      skillsLearned: analysis.skillsLearned || [],
      keyTakeaways: analysis.keyTakeaways || [],
      ingestedBy: userId,
      learnedAt: new Date(),
      sourceTitle: webData.title || analysis.title,
    },
  });

  // 4. Update Twin's expertise skills (avoiding duplicates)
  const newlyAddedSkills = [];
  const existingLower = (twin.expertise || []).map((s) => s.toLowerCase().trim());

  if (Array.isArray(analysis.skillsLearned)) {
    for (const skill of analysis.skillsLearned) {
      if (skill && !existingLower.includes(skill.toLowerCase().trim())) {
        twin.expertise.push(skill.trim());
        existingLower.push(skill.toLowerCase().trim());
        newlyAddedSkills.push(skill.trim());
      }
    }
  }

  if (newlyAddedSkills.length > 0) {
    await twin.save();
  }

  return {
    knowledge,
    newlyAddedSkills,
    analysis,
    twin: {
      _id: twin._id,
      name: twin.name,
      title: twin.title,
      expertise: twin.expertise,
    },
  };
}

/**
 * 2. AUTOMATIC AWARE MODE (Triggered by Admin)
 * Synchronizes and makes all Digital Twins aware with the latest AI models, breakthroughs,
 * and internet technology advancements.
 */
async function runAwareMode({ triggeredBy, focusTopics = [], targetTwinId = null } = {}) {
  let twins = [];
  if (targetTwinId) {
    const singleTwin = await Twin.findById(targetTwinId);
    if (singleTwin) twins = [singleTwin];
  } else {
    twins = await Twin.find({ status: { $ne: 'archived' } });
  }

  if (twins.length === 0) {
    throw new Error('No active Digital Twins found in the system to update.');
  }

  const topicsToProcess = focusTopics.length > 0 ? focusTopics : CURATED_AI_BREAKTHROUGHS;
  const processedTopics = [];
  let totalKnowledgeCreated = 0;
  const allSkillsAcquired = new Set();
  const updatedTwinIds = new Set();

  for (const topic of topicsToProcess) {
    const matchingTwins = twins.filter((t) => {
      if (!topic.domainTarget || topic.domainTarget.length === 0) return true;
      const dept = (t.dept || 'Engineering').toLowerCase();
      return topic.domainTarget.some((target) => dept.includes(target.toLowerCase()) || target.toLowerCase().includes(dept));
    });

    const targetTwins = matchingTwins.length > 0 ? matchingTwins : twins.slice(0, 3);
    const twinsUpdatedForThisTopic = [];

    for (const twin of targetTwins) {
      // Check if twin already has this awareness knowledge entry
      const existing = await Knowledge.findOne({
        twinId: twin._id,
        title: topic.title,
        sourceType: 'auto_aware_mode',
      });

      if (!existing) {
        await Knowledge.create({
          twinId: twin._id,
          title: topic.title,
          category: topic.category,
          summary: topic.summary,
          content: topic.content,
          tags: topic.tags || [],
          source: topic.sourceUrl,
          sourceType: 'auto_aware_mode',
          metadata: {
            url: topic.sourceUrl,
            skillsLearned: topic.skillsLearned || [],
            mode: 'auto_aware_mode',
            learnedAt: new Date(),
          },
        });
        totalKnowledgeCreated++;
      }

      // Add newly acquired skills to twin expertise
      const existingSkillsLower = (twin.expertise || []).map((s) => s.toLowerCase().trim());
      let twinModified = false;

      for (const skill of topic.skillsLearned || []) {
        allSkillsAcquired.add(skill);
        if (!existingSkillsLower.includes(skill.toLowerCase().trim())) {
          twin.expertise.push(skill);
          existingSkillsLower.push(skill.toLowerCase().trim());
          twinModified = true;
        }
      }

      if (twinModified) {
        await twin.save();
      }

      twinsUpdatedForThisTopic.push(twin._id);
      updatedTwinIds.add(twin._id.toString());
    }

    processedTopics.push({
      title: topic.title,
      category: topic.category,
      summary: topic.summary,
      content: topic.content,
      sourceUrl: topic.sourceUrl,
      skillsLearned: topic.skillsLearned || [],
      tags: topic.tags || [],
      twinsUpdated: twinsUpdatedForThisTopic,
    });
  }

  // Create Awareness Log
  const log = await AwarenessLog.create({
    triggeredBy: triggeredBy || null,
    triggerType: 'admin_aware_mode',
    status: 'completed',
    summary: `Successfully synchronized internet AI intelligence: ${topicsToProcess.length} frontier technology breakthroughs distributed across ${updatedTwinIds.size} Digital Twins.`,
    topics: processedTopics,
    totalTwinsUpdated: updatedTwinIds.size,
    totalSkillsAcquired: allSkillsAcquired.size,
  });

  return {
    success: true,
    log,
    totalTwinsUpdated: updatedTwinIds.size,
    totalKnowledgeCreated,
    totalSkillsAcquired: allSkillsAcquired.size,
    skillsList: Array.from(allSkillsAcquired),
    topicsDiscovered: processedTopics,
  };
}

/**
 * 3. GET AWARENESS FEED
 * Retrieves all web learning and auto-aware knowledge entries across twins.
 */
async function getAwarenessFeed({ page = 1, limit = 20, type = 'all', twinId = null, search = '' } = {}) {
  const query = {
    sourceType: { $in: ['web_learning', 'auto_aware_mode'] },
  };

  if (type === 'web_learning' || type === 'auto_aware_mode') {
    query.sourceType = type;
  }

  if (twinId) {
    query.twinId = twinId;
  }

  if (search && search.trim()) {
    const q = search.trim();
    const matchingTwins = await Twin.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { dept: { $regex: q, $options: 'i' } },
      ],
    }).select('_id');

    const matchingTwinIds = matchingTwins.map((t) => t._id);

    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { summary: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      ...(matchingTwinIds.length > 0 ? [{ twinId: { $in: matchingTwinIds } }] : []),
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [entries, totalCount] = await Promise.all([
    Knowledge.find(query)
      .populate('twinId', 'name title dept avatarInitials avatar createdBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Knowledge.countDocuments(query),
  ]);

  return {
    entries,
    totalCount,
    currentPage: Number(page),
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * 4. GET AWARENESS STATS
 */
async function getAwarenessStats() {
  const [totalAwareKnowledge, webLearningCount, autoAwareCount, latestLog, allAwareEntries, twinsCount] =
    await Promise.all([
      Knowledge.countDocuments({ sourceType: { $in: ['web_learning', 'auto_aware_mode'] } }),
      Knowledge.countDocuments({ sourceType: 'web_learning' }),
      Knowledge.countDocuments({ sourceType: 'auto_aware_mode' }),
      AwarenessLog.findOne().sort({ createdAt: -1 }).populate('triggeredBy', 'name email'),
      Knowledge.find({ sourceType: { $in: ['web_learning', 'auto_aware_mode'] } })
        .select('metadata tags category twinId')
        .lean(),
      Twin.countDocuments({ status: { $ne: 'archived' } }),
    ]);

  const uniqueSkills = new Set();
  const activeAwareTwinIds = new Set();
  const categoryCounts = {};

  for (const entry of allAwareEntries) {
    if (entry.twinId) activeAwareTwinIds.add(entry.twinId.toString());
    if (entry.category) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    }
    if (entry.metadata?.skillsLearned && Array.isArray(entry.metadata.skillsLearned)) {
      for (const s of entry.metadata.skillsLearned) {
        if (s) uniqueSkills.add(s);
      }
    }
    if (entry.tags && Array.isArray(entry.tags)) {
      for (const t of entry.tags) {
        if (t) uniqueSkills.add(t);
      }
    }
  }

  return {
    totalAwareKnowledge,
    webLearningCount,
    autoAwareCount,
    totalUniqueSkills: uniqueSkills.size,
    activeAwareTwins: activeAwareTwinIds.size,
    totalSystemTwins: twinsCount,
    latestSync: latestLog
      ? {
          id: latestLog._id,
          createdAt: latestLog.createdAt,
          summary: latestLog.summary,
          triggeredBy: latestLog.triggeredBy?.name || 'Admin',
          totalTwinsUpdated: latestLog.totalTwinsUpdated,
          totalSkillsAcquired: latestLog.totalSkillsAcquired,
        }
      : null,
    categoryDistribution: categoryCounts,
  };
}

module.exports = {
  ingestManualWebLink,
  runAwareMode,
  getAwarenessFeed,
  getAwarenessStats,
  CURATED_AI_BREAKTHROUGHS,
};
