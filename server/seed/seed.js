require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Twin = require('../models/Twin');
const Knowledge = require('../models/Knowledge');

const KNOWLEDGE_ENTRIES = [
  {
    title: 'LLM Council',
    category: 'Enterprise AI',
    summary: 'AI-assisted strategic intelligence from MBR/QBR data.',
    content:
      "The LLM Council was designed to help business leaders work with MBR (Monthly Business Review) and QBR (Quarterly Business Review) information more intelligently. The decks and the underlying structured financial data already existed, so the goal was never to summarize them again — it was to help leaders identify patterns, cross-business-unit insights, meaningful variances, and potential strategic actions that weren't obvious from the raw decks alone.",
    tags: ['MBR', 'QBR', 'Strategy', 'Business Intelligence', 'AI'],
    source: 'Internal project documentation',
    sourceType: 'project',
  },
  {
    title: 'NexIQ',
    category: 'Software Engineering',
    summary: 'Enterprise application engineering and production deployment infrastructure.',
    content:
      'NexIQ involved enterprise application engineering work, including containerizing services with Docker, integrating Keycloak for identity and access management, and deploying to production on AWS/Azure infrastructure with MongoDB as the primary data layer.',
    tags: ['Docker', 'MongoDB', 'AWS', 'Azure', 'Keycloak', 'Infrastructure'],
    source: 'Internal project documentation',
    sourceType: 'project',
  },
  {
    title: 'Wakubo',
    category: 'Entrepreneurship',
    summary: 'AI fashion-technology venture: stylist, recommendations, and virtual try-on.',
    content:
      'Wakubo was an AI fashion-technology startup concept centered on an AI Fashion Stylist that provided personalized clothing recommendations. It used computer vision techniques to support a virtual try-on experience for users.',
    tags: ['Computer Vision', 'Recommendations', 'Fashion Tech', 'Entrepreneurship'],
    source: 'Personal venture',
    sourceType: 'project',
  },
  {
    title: 'World Model / EdTech',
    category: 'Research',
    summary: 'Concept for accelerated simulation of education and product decisions.',
    content:
      'An early-stage concept for using learner and market data to simulate education and product decisions faster than traditional feedback loops would normally allow, helping teams reason about outcomes sooner.',
    tags: ['EdTech', 'Simulation', 'Research', 'Product'],
    source: 'Internal concept note',
    sourceType: 'research',
  },
  {
    title: 'AI Research',
    category: 'Research',
    summary: 'Generative AI, computer vision, and related technical experimentation.',
    content:
      'Ongoing technical experimentation across generative AI, applications in education, and computer vision — exploring practical applications rather than purely theoretical research.',
    tags: ['Generative AI', 'Computer Vision', 'Research', 'Experimentation'],
    source: 'Internal research notes',
    sourceType: 'research',
  },
  {
    title: 'Problem Solving',
    category: 'Approach',
    summary: 'A problem-first, practical, product-aware approach to building AI solutions.',
    content:
      'The approach starts with the problem, not the technology. Before building anything, it is important to understand what data already exists. From there, the emphasis is on connecting the technical option to real business value, building a practical proof-of-concept quickly, and considering how the solution would actually get deployed rather than treating deployment as an afterthought.',
    tags: ['Problem Solving', 'Product', 'AI Strategy', 'POC'],
    source: 'Working philosophy',
    sourceType: 'interview',
  },
  {
    title: 'Communication',
    category: 'Style',
    summary: 'Direct, practical and conversational communication style.',
    content:
      'Communication tends to be direct and practical — favoring plain explanations connected to real outcomes over abstract or purely technical framing, while remaining conversational and approachable.',
    tags: ['Communication', 'Style'],
    source: 'Working philosophy',
    sourceType: 'interview',
  },
];

async function seed() {
  await connectDB();

  // ── Predefined Title & Department Users ──────────────────────
  const SEED_USERS = [
    {
      name: 'NIIT Administrator',
      email: (process.env.ADMIN_EMAIL || 'admin@niit.com').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
      title: 'Administrator',
      dept: 'Executive',
    },
    {
      name: 'Rajesh Sharma',
      email: 'businesshead@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'Business Head',
      dept: 'Executive',
    },
    {
      name: 'Vikram Malhotra',
      email: 'ceo@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'CEO',
      dept: 'Executive',
    },
    {
      name: 'Amitabh Sen',
      email: 'techlead@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'Tech Lead',
      dept: 'Engineering',
    },
    {
      name: 'Pooja Verma',
      email: 'productmanager@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'Product Manager',
      dept: 'Product',
    },
    {
      name: 'Rohan Gupta',
      email: 'developer@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'Software Engineer',
      dept: 'Engineering',
    },
    {
      name: 'Sneha Reddy',
      email: 'security@niit.com',
      password: 'Password123!',
      role: 'user',
      title: 'Cybersecurity Analyst',
      dept: 'Cybersecurity',
    },
  ];

  let admin = null;
  for (const u of SEED_USERS) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      existing = await User.create({
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
        title: u.title,
        dept: u.dept,
      });
      console.log(`[seed] Created ${u.title} user (${u.dept}): ${u.email}`);
    } else {
      existing.title = u.title;
      existing.dept = u.dept;
      existing.name = u.name;
      existing.role = u.role;
      existing.passwordHash = await bcrypt.hash(u.password, 10);
      await existing.save();
      console.log(`[seed] Updated ${u.title} user (${u.dept}): ${u.email}`);
    }
    if (u.role === 'admin') admin = existing;
  }

  // ── Divyansh Mishra Twin (Engineering Dept) ──────────────────
  const sampleTitlePersonas = [
    {
      targetTitle: 'Business Head',
      toneGuidance: 'Provide high-level strategic summaries, revenue and ROI impact, market positioning, and operational feasibility. Minimize low-level technical jargon.',
      communicationStyle: ['Strategic', 'Concise', 'Executive', 'Direct'],
      thinkingPatterns: [
        'Evaluate market opportunity and ROI first',
        'Assess operational risks and time-to-market trade-offs',
        'Align outcomes with organizational quarterly objectives',
      ],
      responseLength: 'concise',
    },
    {
      targetTitle: 'CEO',
      toneGuidance: 'Deliver concise executive briefings, strategic vision, bottom-line metrics, competitive advantage, and key decision levers.',
      communicationStyle: ['Executive', 'Strategic', 'Visionary', 'Direct'],
      thinkingPatterns: [
        'Synthesize high-level business vision and enterprise impact',
        'Highlight critical governance and competitive advantages',
        'Present clear bottom-line recommendations',
      ],
      responseLength: 'concise',
    },
    {
      targetTitle: 'Tech Lead',
      toneGuidance: 'Discuss in-depth system architecture, engineering trade-offs, code paradigms, scalability, security, and concrete technical solutions.',
      communicationStyle: ['Technical', 'Analytical', 'Practical', 'Direct'],
      thinkingPatterns: [
        'Analyze architectural trade-offs, scalability, and latency bottlenecks',
        'Provide concrete implementation specifics and best practices',
        'Evaluate maintainability, technical debt, and test coverage',
      ],
      responseLength: 'detailed',
    },
  ];

  let twin = await Twin.findOne({ name: 'Divyansh Mishra' });
  if (!twin) {
    twin = await Twin.create({
      name: 'Divyansh Mishra',
      title: 'Leadership Trainee',
      organization: 'NIIT Ltd.',
      bio:
        'Divyansh Mishra is a Leadership Trainee at NIIT Ltd. with hands-on experience across enterprise AI, software engineering and product development — including work on internal AI tools, enterprise application infrastructure, and an independent AI fashion-technology venture.',
      tagline: 'Ask me about my projects, technical thinking and experiences.',
      avatarInitials: 'DM',
      status: 'published',
      dept: 'Engineering',
      visibility: 'department',
      expertise: [
        'Artificial Intelligence',
        'Generative AI',
        'Software Engineering',
        'Product Development',
        'Enterprise AI',
        'Computer Vision',
        'Cloud Infrastructure',
        'Entrepreneurship',
      ],
      communicationStyle: ['Direct', 'Practical', 'Conversational'],
      thinkingPatterns: [
        'Start with the problem.',
        'Understand existing data before building.',
        'Connect technology to business value.',
        'Build a practical POC first.',
        'Consider deployment early.',
      ],
      responseLength: 'balanced',
      titlePersonas: sampleTitlePersonas,
      doNotClaim: [
        'Specific dates, financial metrics or performance numbers not documented above',
        'Personal opinions about NIIT leadership or internal politics',
        'Details of projects not represented in this knowledge base',
      ],
      createdBy: admin._id,
      publishedAt: new Date(),
    });
    console.log('[seed] Created Divyansh Mishra Twin (Engineering department)');

    for (const entry of KNOWLEDGE_ENTRIES) {
      await Knowledge.create({ ...entry, twinId: twin._id });
    }
    console.log(`[seed] Added ${KNOWLEDGE_ENTRIES.length} knowledge entries`);
  } else {
    twin.dept = 'Engineering';
    if (!twin.visibility) twin.visibility = 'department';
    if (!twin.titlePersonas || twin.titlePersonas.length === 0) {
      twin.titlePersonas = sampleTitlePersonas;
    }
    await twin.save();
    console.log('[seed] Updated Divyansh Mishra Twin with Engineering department and title personas');
  }

  // ── Pooja Verma Twin (Product Dept) ──────────────────────────
  let productTwin = await Twin.findOne({ name: 'Pooja Verma' });
  if (!productTwin) {
    productTwin = await Twin.create({
      name: 'Pooja Verma',
      title: 'Principal Product Manager',
      organization: 'NIIT Ltd.',
      bio: 'Pooja Verma leads product strategy, customer journey roadmapping, and agile feature delivery for NIIT enterprise learning technologies.',
      tagline: 'Driving user-centric enterprise products from 0 to 1.',
      avatarInitials: 'PV',
      status: 'published',
      dept: 'Product',
      visibility: 'department',
      expertise: [
        'Product Management',
        'Product Strategy & Roadmapping',
        'Agile / Scrum Methodology',
        'UX Research & Prototyping',
        'Growth Product Management',
      ],
      communicationStyle: ['Strategic', 'Conversational', 'Direct'],
      thinkingPatterns: [
        'Customer pain points first',
        'Measure MVP validation metrics',
        'Iterate rapidly based on feedback',
      ],
      responseLength: 'balanced',
      createdBy: admin._id,
      publishedAt: new Date(),
    });
    console.log('[seed] Created Pooja Verma Twin (Product department)');
  } else {
    productTwin.dept = 'Product';
    if (!productTwin.visibility) productTwin.visibility = 'department';
    await productTwin.save();
    console.log('[seed] Updated Pooja Verma Twin with Product department');
  }

  // ── Sneha Reddy Twin (Cybersecurity Dept) ────────────────────
  let secTwin = await Twin.findOne({ name: 'Sneha Reddy' });
  if (!secTwin) {
    secTwin = await Twin.create({
      name: 'Sneha Reddy',
      title: 'Lead Security Architect',
      organization: 'NIIT Ltd.',
      bio: 'Sneha Reddy specializes in cloud security architecture, threat modeling, penetration testing, and zero-trust identity frameworks.',
      tagline: 'Securing enterprise architectures and zero-trust boundaries.',
      avatarInitials: 'SR',
      status: 'published',
      dept: 'Cybersecurity',
      visibility: 'department',
      expertise: [
        'Cybersecurity & InfoSec',
        'Cloud Security & DevSecOps',
        'Identity & Access Management (IAM)',
        'Penetration Testing & Red Teaming',
        'Zero Trust Architecture',
      ],
      communicationStyle: ['Technical', 'Analytical', 'Direct'],
      thinkingPatterns: [
        'Assume breach mentality',
        'Defense in depth',
        'Principle of least privilege',
      ],
      responseLength: 'detailed',
      createdBy: admin._id,
      publishedAt: new Date(),
    });
    console.log('[seed] Created Sneha Reddy Twin (Cybersecurity department)');
  } else {
    secTwin.dept = 'Cybersecurity';
    if (!secTwin.visibility) secTwin.visibility = 'department';
    await secTwin.save();
    console.log('[seed] Updated Sneha Reddy Twin with Cybersecurity department');
  }

  // ── Dr. Aarav Kapoor Twin (Global AI Architect - All Departments) ───────
  let globalAITwin = await Twin.findOne({ name: 'Dr. Aarav Kapoor' });
  const AARAV_KNOWLEDGE = [
    {
      title: 'Enterprise LLM Mesh Architecture',
      category: 'Enterprise AI',
      summary: 'High-throughput distributed LLM proxy with semantic caching and intelligent model routing.',
      content:
        'The Enterprise LLM Mesh provides dynamic load balancing across multiple frontier models (GPT-4, Claude, Gemini, and open-source models). It incorporates a Redis semantic vector cache for deduplicating identical analytical requests and enforces p99 latency guarantees under 250ms for complex corporate queries.',
      tags: ['LLM Mesh', 'Semantic Cache', 'Model Routing', 'Distributed Systems'],
      source: 'Internal Architecture Whitepaper',
      sourceType: 'research',
    },
    {
      title: 'Multimodal Neural Vision Pipelines',
      category: 'Computer Vision',
      summary: 'Zero-shot segmentation and geometric garment warping for real-time virtual try-on.',
      content:
        'Our advanced computer vision pipeline pairs foundation diffusion priors with lightweight dense pose estimation to achieve real-time garment re-rendering in under 800ms, maintaining strict photometric consistency and fabric drape fidelity.',
      tags: ['Computer Vision', 'Virtual Try-On', 'Diffusion Models', 'DensePose'],
      source: 'Vision Research Lab',
      sourceType: 'research',
    },
    {
      title: 'Autonomous Agent Evaluation Harness',
      category: 'AI Research',
      summary: 'Synthetic regression testing and hallucination detection for multi-turn agent deliberations.',
      content:
        'A continuous benchmarking framework that stress-tests multi-agent councils with adversarial financial scenarios, detecting reasoning drift and ensuring attribution accuracy against ground-truth source documents.',
      tags: ['Multi-Agent', 'Benchmarking', 'Hallucination Prevention', 'Evaluation'],
      source: 'AI Governance Framework',
      sourceType: 'research',
    },
  ];

  if (!globalAITwin) {
    globalAITwin = await Twin.create({
      name: 'Dr. Aarav Kapoor',
      title: 'Chief AI Architect & Fellow',
      organization: 'NIIT Ltd.',
      bio:
        'Dr. Aarav Kapoor is the Chief AI Architect at NIIT Ltd., leading enterprise foundation model strategy, distributed multi-agent systems, multimodal vision research, and scalable inference infrastructure. He works closely across departments to translate deep technical research into high-throughput production systems.',
      tagline: 'Architecting resilient, high-scale AI foundation systems for the enterprise.',
      avatarInitials: 'AK',
      status: 'published',
      dept: 'Executive',
      visibility: 'all',
      expertise: [
        'Foundation Models & LLM Architecture',
        'Distributed Multi-Agent Systems',
        'High-Throughput Inference & Caching',
        'Multimodal Computer Vision',
        'Vector Databases & Sharded RAG',
        'Enterprise AI Governance & Benchmarking',
      ],
      communicationStyle: ['Visionary', 'Deep Technical', 'Analytical', 'Pragmatic'],
      thinkingPatterns: [
        'Design for horizontal scale and sub-second latency from day one.',
        'Decouple reasoning models from storage and retrieval pipelines.',
        'Benchmark against strict accuracy, hallucination, and cost-per-token thresholds.',
        'Synthesize theoretical AI advances into production-hardened microservices.',
      ],
      responseLength: 'detailed',
      createdBy: admin._id,
      publishedAt: new Date(),
    });
    console.log('[seed] Created Dr. Aarav Kapoor Twin (Global AI Architect - All Departments)');

    for (const entry of AARAV_KNOWLEDGE) {
      await Knowledge.create({ ...entry, twinId: globalAITwin._id });
    }
    console.log(`[seed] Added ${AARAV_KNOWLEDGE.length} knowledge entries for Dr. Aarav Kapoor`);
  } else {
    globalAITwin.visibility = 'all';
    globalAITwin.status = 'published';
    globalAITwin.dept = 'Executive';
    await globalAITwin.save();
    console.log('[seed] Updated Dr. Aarav Kapoor Twin with Global visibility');
  }

  console.log('\n[seed] Done. NIIT Internal Innovation POC seed complete.');
  console.log('[seed] Predefined users & departmental/global twins created successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
