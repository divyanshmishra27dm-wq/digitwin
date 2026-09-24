const axios = require('axios');
const { extractTextFromFile } = require('./docExtractorService');

/**
 * Intelligent CV Parser:
 * Takes an uploaded CV / Resume file, extracts text, and extracts
 * structured identity, bio, tagline, skills, detailed projects, experience,
 * education, and persona traits using LLM (with heuristic fallback).
 */
async function parseCVDocument(file) {
  const text = await extractTextFromFile(file);
  const fileName = file.originalname || 'Uploaded_CV.pdf';

  let parsedData = null;

  if (process.env.LITELLM_API_KEY) {
    try {
      parsedData = await extractWithLLM(text);
    } catch (err) {
      console.warn('[cvParserService] LLM extraction failed or timed out, using heuristic parser:', err.message);
      parsedData = extractWithHeuristics(text, fileName);
    }
  } else {
    parsedData = extractWithHeuristics(text, fileName);
  }

  // Ensure consistent and safe defaults
  return sanitizeParsedCV(parsedData, text, fileName);
}

async function extractWithLLM(resumeText) {
  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');
  const model = process.env.LITELLM_MODEL || 'azure-gpt-l1';

  // Truncate resume text if excessively long to fit token limits comfortably
  const clippedText = resumeText.slice(0, 16000);

  const prompt = `You are an expert AI Resume and Knowledge Extraction engine.
Analyze the following candidate's CV/Resume text and extract a comprehensive, structured profile in JSON.

CRITICAL REQUIREMENTS:
1. "name": Candidate's full name.
2. "title": Professional title (e.g., "Senior AI Engineer", "Leadership Trainee", "Full Stack Developer", "Cloud Architect").
3. "organization": Current or most recent company or institution (default to "NIIT Ltd." if unclear).
4. "dept": Inferred department (e.g., "Engineering", "Product", "Cybersecurity", "Executive", "Marketing", "Sales", "General").
5. "bio": A rich, compelling 2-3 paragraph professional biography highlighting strengths, accomplishments, domain mastery, and leadership.
6. "tagline": An engaging 1-sentence tagline describing their focus (e.g., "Building scalable AI architectures, multi-agent systems, and enterprise intelligence solutions.").
7. "expertise": Array of 8 to 20 technical skills, frameworks, tools, and domain keywords (e.g. ["Python", "React", "Node.js", "RAG Systems", "Vector Databases", "Docker", "PyTorch"]).
8. "projects": Array of detailed projects worked on by the candidate. For EACH project, provide:
   - "title": Project name (e.g., "LLM Council Consensus Platform", "NexIQ Enterprise App")
   - "category": Domain category (e.g., "Enterprise AI", "Cloud Infrastructure", "Machine Learning", "Full Stack Development", "Product Engineering")
   - "summary": 2-3 sentence overview of what the project is and what problem it solves.
   - "content": In-depth description with technical architecture, technologies used, design decisions, metrics, quantified impact, and problem-solving highlights.
   - "tags": Array of 3-6 tech stack/concept tags.
9. "experience": Array of objects: [{ "company": "...", "role": "...", "duration": "...", "description": "..." }]
10. "education": Array of objects: [{ "institution": "...", "degree": "...", "year": "...", "details": "..." }]
11. "communicationStyle": Array of 3-5 style traits (e.g. ["Direct", "Analytical", "Practical", "Conversational", "Strategic"])
12. "thinkingPatterns": Array of 3-5 problem-solving principles (e.g. ["Deconstruct problems from first principles", "Prioritize measurable business impact and latency trade-offs", "Design modular and scalable architectures"])
13. "doNotClaim": Array of 2-4 reasonable guardrails (e.g. ["Undisclosed proprietary algorithms", "Unverified financial returns"])

RESUME TEXT:
"""
${clippedText}
"""

Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "title": "string",
  "organization": "string",
  "dept": "string",
  "bio": "string",
  "tagline": "string",
  "expertise": ["string"],
  "projects": [
    {
      "title": "string",
      "category": "string",
      "summary": "string",
      "content": "string",
      "tags": ["string"]
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "year": "string",
      "details": "string"
    }
  ],
  "communicationStyle": ["string"],
  "thinkingPatterns": ["string"],
  "doNotClaim": ["string"]
}`;

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 35000,
    }
  );

  const raw = response.data.choices?.[0]?.message?.content || '{}';
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Heuristic rule-based fallback parser when LLM is unavailable.
 */
function extractWithHeuristics(text, fileName) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Digital Twin';
  const name = firstLine.length < 50 && !firstLine.includes('@') && !firstLine.includes('http') ? firstLine : 'Expert Twin';

  // Common skill keywords to look for
  const KNOWN_SKILLS = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Next.js', 'Vue',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision',
    'RAG', 'Vector Databases', 'LangChain', 'LlamaIndex', 'FastAPI', 'Flask', 'Django',
    'Microservices', 'GraphQL', 'REST API', 'CI/CD', 'Git', 'Linux', 'System Design',
    'Keycloak', 'OAuth', 'Product Management', 'Data Science', 'Pandas', 'NumPy', 'Scikit-learn'
  ];

  const matchedSkills = KNOWN_SKILLS.filter((s) => {
    const regex = new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i');
    return regex.test(text);
  });

  const expertise = matchedSkills.length > 0 ? matchedSkills : ['Software Engineering', 'AI Systems', 'System Design'];

  // Identify sections
  const sections = splitIntoSections(lines);

  const projects = [];
  if (sections.projects && sections.projects.length > 0) {
    const projectBlocks = groupIntoBlocks(sections.projects);
    projectBlocks.forEach((block, idx) => {
      const pTitle = block[0] || `Project ${idx + 1}`;
      const pContent = block.slice(1).join('\n') || block.join('\n');
      projects.push({
        title: pTitle.slice(0, 60),
        category: 'Engineering & Technology',
        summary: block.slice(1, 3).join(' ') || pTitle,
        content: pContent,
        tags: matchedSkills.slice(idx * 2, idx * 2 + 3),
      });
    });
  }

  // If no structured projects detected, create a master resume knowledge item
  if (projects.length === 0) {
    projects.push({
      title: `${name} - Professional Background & Projects`,
      category: 'Professional Overview',
      summary: `Documented professional background, engineering projects, and competencies extracted from ${fileName}.`,
      content: text.slice(0, 2500),
      tags: expertise.slice(0, 5),
    });
  }

  return {
    name,
    title: 'Senior Engineer & Specialist',
    organization: 'NIIT Ltd.',
    dept: 'Engineering',
    bio: `${name} is an experienced professional with a strong track record in ${expertise.slice(0, 4).join(', ')}. Known for rigorous problem-solving and delivering high-impact technological solutions.`,
    tagline: `Specialist in ${expertise.slice(0, 3).join(', ')} & enterprise solution architecture.`,
    expertise,
    projects,
    experience: [],
    education: [],
    communicationStyle: ['Direct', 'Analytical', 'Practical', 'Conversational'],
    thinkingPatterns: [
      'Break complex technical problems into structured components',
      'Optimize for measurable business impact and engineering scalability',
      'Verify architecture assumptions with rapid proof-of-concepts',
    ],
    doNotClaim: ['Non-documented proprietary trade secrets', 'Unverified metrics'],
  };
}

function splitIntoSections(lines) {
  const sections = { summary: [], experience: [], education: [], projects: [], skills: [] };
  let currentSec = 'summary';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(experience|work experience|employment history|work history)/i.test(lower)) {
      currentSec = 'experience';
    } else if (/^(education|academic background|qualifications)/i.test(lower)) {
      currentSec = 'education';
    } else if (/^(projects|key projects|technical projects|portfolio)/i.test(lower)) {
      currentSec = 'projects';
    } else if (/^(skills|technical skills|competencies|technologies)/i.test(lower)) {
      currentSec = 'skills';
    } else {
      sections[currentSec]?.push(line);
    }
  }

  return sections;
}

function groupIntoBlocks(lines) {
  const blocks = [];
  let currentBlock = [];

  for (const line of lines) {
    if (line.length < 50 && (line.includes(':') || /^[A-Z0-9\s\-–]{3,}$/.test(line))) {
      if (currentBlock.length > 0) blocks.push(currentBlock);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);
  return blocks;
}

function sanitizeParsedCV(parsed, rawText, fileName) {
  const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Digital Twin';
  const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Specialist';
  const organization = typeof parsed.organization === 'string' && parsed.organization.trim() ? parsed.organization.trim() : 'NIIT Ltd.';
  const dept = typeof parsed.dept === 'string' && parsed.dept.trim() ? parsed.dept.trim() : 'Engineering';
  const bio = typeof parsed.bio === 'string' && parsed.bio.trim() ? parsed.bio.trim() : `${name} is a specialist in ${title} at ${organization}.`;
  const tagline = typeof parsed.tagline === 'string' && parsed.tagline.trim() ? parsed.tagline.trim() : `Ask me about my projects, technical thinking and experiences.`;

  const expertise = Array.isArray(parsed.expertise)
    ? parsed.expertise.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
    : [];

  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const projects = rawProjects.map((p, idx) => ({
    title: typeof p.title === 'string' && p.title.trim() ? p.title.trim() : `Project ${idx + 1}`,
    category: typeof p.category === 'string' && p.category.trim() ? p.category.trim() : 'Project',
    summary: typeof p.summary === 'string' && p.summary.trim() ? p.summary.trim() : (p.content || '').slice(0, 180),
    content: typeof p.content === 'string' && p.content.trim() ? p.content.trim() : p.summary || '',
    tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    source: fileName,
    sourceType: 'cv_upload',
  })).filter((p) => p.title && (p.summary || p.content));

  const communicationStyle = Array.isArray(parsed.communicationStyle) && parsed.communicationStyle.length > 0
    ? parsed.communicationStyle
    : ['Direct', 'Conversational', 'Technical', 'Practical'];

  const thinkingPatterns = Array.isArray(parsed.thinkingPatterns) && parsed.thinkingPatterns.length > 0
    ? parsed.thinkingPatterns
    : [
        'Deconstruct problems into first-principles components',
        'Prioritize measurable impact and clean architecture',
        'Analyze system trade-offs before committing to an approach',
      ];

  const doNotClaim = Array.isArray(parsed.doNotClaim) && parsed.doNotClaim.length > 0
    ? parsed.doNotClaim
    : ['Unverified personal claims', 'Undisclosed confidential metrics'];

  return {
    name,
    title,
    organization,
    dept,
    bio,
    tagline,
    expertise,
    projects,
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    communicationStyle,
    thinkingPatterns,
    doNotClaim,
    rawTextLength: rawText.length,
    fileName,
  };
}

module.exports = { parseCVDocument };
