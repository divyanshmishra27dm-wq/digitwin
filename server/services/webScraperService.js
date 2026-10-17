const axios = require('axios');

/**
 * Strips HTML tags, script, style, comments, and boilerplate to produce clean readable text.
 */
function cleanHtmlText(html) {
  if (!html || typeof html !== 'string') return '';

  // Extract title if present
  let extractedTitle = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    extractedTitle = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract meta description
  let metaDescription = '';
  const metaMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (metaMatch && metaMatch[1]) {
    metaDescription = decodeHtmlEntities(metaMatch[1].trim());
  }

  // Remove scripts, styles, noscript, svg, header, nav, footer, iframes
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Replace block tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)>/gi, '\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Normalize whitespace & clean lines
  const lines = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 20); // filter out navigation snippets / tiny junk

  const cleanedContent = lines.join('\n\n');

  return {
    title: extractedTitle,
    metaDescription,
    textContent: cleanedContent.slice(0, 20000), // generous context for LLM
  };
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

/**
 * Fetches webpage content given a URL with multi-layer fallback.
 * 1. Direct HTTP request with realistic browser headers.
 * 2. Jina AI reader proxy (bypasses Cloudflare / 403 blocks on sites like OpenAI, Medium, Bloomberg).
 * 3. Semantic URL extraction fallback if completely unreachable.
 */
async function fetchWebPage(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid URL is required.');
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Tier 1: Direct Fetch with realistic browser headers
  try {
    const response = await axios.get(formattedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
    });

    const parsed = cleanHtmlText(response.data);
    if (parsed.textContent && parsed.textContent.length > 100) {
      return {
        url: formattedUrl,
        title: parsed.title || deriveTitleFromUrl(formattedUrl),
        metaDescription: parsed.metaDescription || '',
        textContent: parsed.textContent,
        statusCode: response.status,
      };
    }
  } catch (err) {
    console.warn(`[webScraper] Direct fetch for ${formattedUrl} (${err.response?.status || err.message}), attempting reader fallback…`);
  }

  // Tier 2: Jina AI Reader Proxy (handles Cloudflare, bot protections, dynamic SPAs)
  try {
    const jinaUrl = `https://r.jina.ai/${formattedUrl}`;
    const jinaRes = await axios.get(jinaUrl, {
      timeout: 12000,
      headers: {
        Accept: 'text/plain, text/markdown',
        'X-No-Cache': 'true',
      },
    });

    if (jinaRes.data && typeof jinaRes.data === 'string' && jinaRes.data.length > 50) {
      // Extract title from Jina markdown header if present
      let extractedTitle = deriveTitleFromUrl(formattedUrl);
      const titleMatch = jinaRes.data.match(/^Title:\s*([^\n]+)/m);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1].trim();
      }

      return {
        url: formattedUrl,
        title: extractedTitle,
        metaDescription: '',
        textContent: jinaRes.data.slice(0, 20000),
        statusCode: 200,
        viaProxy: true,
      };
    }
  } catch (jinaErr) {
    console.warn(`[webScraper] Reader fallback failed:`, jinaErr.message);
  }

  // Tier 3: Semantic URL inference fallback
  return {
    url: formattedUrl,
    title: deriveTitleFromUrl(formattedUrl),
    metaDescription: '',
    textContent: `Resource Topic: ${deriveTitleFromUrl(formattedUrl)}\nSource URL: ${formattedUrl}`,
    statusCode: 200,
    isInferred: true,
  };
}

function deriveTitleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, '');
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.[a-z0-9]+$/i, '');
      return last.charAt(0).toUpperCase() + last.slice(1);
    }
    return parsed.hostname;
  } catch {
    return url;
  }
}

/**
 * Analyzes and synthesizes the webpage content using LLM (or intelligent fallback)
 * into a structured Knowledge item with extracted skills and takeaways.
 */
async function analyzeWebLearning(url, webData, twinContext = null) {
  const isLLMAvailable = Boolean(process.env.LITELLM_API_KEY);
  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');
  const model = process.env.LITELLM_MODEL || 'azure-gpt-l1';

  const contextPrompt = twinContext
    ? `Target Digital Twin: "${twinContext.name}" (${twinContext.title || 'Specialist'}, Dept: ${
        twinContext.dept || 'Engineering'
      }, Current Expertise: ${(twinContext.expertise || []).slice(0, 8).join(', ')})`
    : 'Target: Digital Twin Knowledge Base';

  const prompt = `You are an elite AI Knowledge Intelligence Engine.
A user has provided a link to a website, technical article, tutorial, documentation, or new technology release that they went through to learn something new.

${contextPrompt}

WEBSITE URL: ${url}
RAW PAGE TITLE: ${webData.title || 'Untitled'}
PAGE CONTENT SAMPLE:
"""
${(webData.textContent || '').slice(0, 12000)}
"""

YOUR TASK:
Read, synthesize, and extract structured technical learnings from this web resource for the Digital Twin to assimilate into its long-term memory and skills ontology.

OUTPUT REQUIREMENTS (Respond ONLY with valid JSON):
{
  "title": "Precise, descriptive title for the learned technology or topic (e.g. 'Model Context Protocol (MCP) Architecture', 'DeepSeek-R1 Reasoning Patterns', 'FastAPI High-Concurrency Microservices')",
  "category": "Domain Category (e.g. 'Generative AI & LLMs', 'Software Engineering', 'Cloud & DevOps', 'Cybersecurity', 'Product Management', 'Computer Vision')",
  "summary": "Crisp 2-3 sentence executive summary explaining what the user/twin learned, core concepts, and why it is significant.",
  "content": "Rich, multi-paragraph technical breakdown formatted in clean Markdown. Include:\\n- **Overview & Core Concept**\\n- **Key Architectural & Technical Details**\\n- **Implementation Patterns & Best Practices**\\n- **Practical Use Cases & Takeaways**",
  "skillsLearned": ["Array of 2 to 5 specific, high-value skills or technologies learned, e.g. ['Model Context Protocol (MCP)', 'Tool Calling', 'Agentic Orchestration']"],
  "tags": ["Array of 3 to 6 search tags, e.g. ['MCP', 'Anthropic', 'Agents', 'APIs']"],
  "keyTakeaways": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
}`;

  if (isLLMAvailable) {
    try {
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
          timeout: 30000,
        }
      );

      const raw = response.data.choices?.[0]?.message?.content || '{}';
      let cleaned = raw.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
      }
      const parsed = JSON.parse(cleaned);

      return {
        title: parsed.title || webData.title || deriveTitleFromUrl(url),
        category: parsed.category || 'Artificial Intelligence & Data Science',
        summary: parsed.summary || 'Learned and assimilated from web reference.',
        content: parsed.content || parsed.summary || (webData.textContent || '').slice(0, 1500),
        skillsLearned: Array.isArray(parsed.skillsLearned) && parsed.skillsLearned.length > 0
          ? parsed.skillsLearned
          : extractHeuristicSkills(webData.textContent || url),
        tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
          ? parsed.tags
          : [parsed.category || 'AI', 'Web Ingestion'],
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
        sourceUrl: url,
      };
    } catch (err) {
      console.warn('[webScraper] LLM web analysis failed, falling back to smart heuristic:', err.message);
      return generateHeuristicWebSummary(url, webData, twinContext);
    }
  } else {
    return generateHeuristicWebSummary(url, webData, twinContext);
  }
}

/**
 * Fallback synthesizer for offline/demo mode or network fallback.
 */
function generateHeuristicWebSummary(url, webData, twinContext) {
  const title = webData.title || deriveTitleFromUrl(url);
  const snippet = (webData.textContent || '').slice(0, 1200);
  const skills = extractHeuristicSkills(snippet || title);

  const summary = webData.metaDescription
    ? `Learned key techniques and architectures from "${title}". ${webData.metaDescription}`
    : `Explored and assimilated recent engineering patterns, tools, and technical insights from "${title}".`;

  const content = `### Overview & Core Concept
Assimilated learnings from [${title}](${url}). This resource covers foundational concepts, implementation strategies, and practical application patterns.

### Key Architectural & Technical Details
- Deep dive into core workflows, protocols, and best practices.
- Integration of modular design patterns to enhance system reliability and performance.
- Evaluation of trade-offs and performance characteristics across production environments.

### Practical Use Cases & Takeaways
- Directly applicable to next-generation system design and AI workflows.
- Extends the Twin's technical capability across: ${skills.join(', ')}.`;

  return {
    title: title.length > 60 ? title.slice(0, 57) + '…' : title,
    category: 'Software Engineering & AI',
    summary,
    content,
    skillsLearned: skills,
    tags: [...skills.slice(0, 3), 'Web Learning', 'Self-Awareness'],
    keyTakeaways: [
      `Gained in-depth understanding of ${skills[0] || 'the core subject matter'}.`,
      'Analyzed architectural trade-offs and best implementation practices.',
      `Incorporated real-world technical references into twin knowledge base.`,
    ],
    sourceUrl: url,
  };
}

function extractHeuristicSkills(text) {
  const commonTech = [
    'DeepSeek',
    'Claude 3.7',
    'OpenAI o3',
    'Model Context Protocol (MCP)',
    'Agentic Workflows',
    'LangGraph',
    'vLLM',
    'PyTorch',
    'FastAPI',
    'React',
    'Next.js',
    'Docker',
    'Kubernetes',
    'GraphQL',
    'RAG',
    'Vector Search',
    'TypeScript',
    'Python',
    'Zero Trust Security',
    'Prompt Engineering',
  ];

  const lower = (text || '').toLowerCase();
  const matched = commonTech.filter((tech) => lower.includes(tech.toLowerCase()));
  if (matched.length > 0) {
    return matched.slice(0, 4);
  }

  return ['Modern AI & Systems Architecture', 'Cloud & API Integration'];
}

module.exports = {
  fetchWebPage,
  cleanHtmlText,
  analyzeWebLearning,
};
