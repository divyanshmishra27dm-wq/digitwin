const axios = require('axios');
const { extractTextFromFile } = require('./docExtractorService');
const Knowledge = require('../models/Knowledge');

/**
 * Ingests an uploaded document (PDF, Word, Text, Markdown) for a Twin.
 * Converts unstructured document text into structured, high-value RAG knowledge entries.
 */
async function ingestDocumentForTwin(twinId, file) {
  const text = await extractTextFromFile(file);
  const fileName = file.originalname || 'Uploaded_Document.pdf';

  let knowledgeEntries = [];

  if (process.env.LITELLM_API_KEY) {
    try {
      knowledgeEntries = await synthesizeDocumentWithLLM(text, fileName);
    } catch (err) {
      console.warn('[ragService] LLM document synthesis failed, falling back to chunker:', err.message);
      knowledgeEntries = chunkDocumentHeuristically(text, fileName);
    }
  } else {
    knowledgeEntries = chunkDocumentHeuristically(text, fileName);
  }

  // Save parsed entries to the database
  const createdDocs = [];
  for (let i = 0; i < knowledgeEntries.length; i++) {
    const item = knowledgeEntries[i];
    const doc = await Knowledge.create({
      twinId,
      title: item.title,
      category: item.category || 'Documented Project',
      summary: item.summary || item.title,
      content: item.content || item.summary,
      tags: Array.isArray(item.tags) ? item.tags : [],
      source: fileName,
      sourceType: 'document_upload',
      chunkIndex: i,
      metadata: {
        fileName,
        fileSize: file.size || text.length,
        ingestedAt: new Date(),
      },
    });
    createdDocs.push(doc);
  }

  return {
    fileName,
    createdEntries: createdDocs,
    count: createdDocs.length,
  };
}

/**
 * Uses LLM to intelligently analyze the document and extract structured project / knowledge items.
 */
async function synthesizeDocumentWithLLM(docText, fileName) {
  const baseUrl = (process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');
  const model = process.env.LITELLM_MODEL || 'azure-gpt-l1';

  const clippedText = docText.slice(0, 18000);

  const prompt = `You are an expert Document Intelligence and Knowledge Base Architect for an AI Digital Twin system.
Analyze the following document ("${fileName}") and deconstruct it into 1 to 6 high-value, structured Knowledge Base entries.
Each entry represents a distinct project, case study, system architecture, methodology, research paper, or operational domain documented in the file.

CRITICAL GUIDELINES FOR EACH ENTRY:
1. "title": A clear, recognizable title (e.g., "NexIQ: Enterprise Architecture & Cloud Infra", "LLM Council: Multi-Agent MBR Decision Engine", "Project XYZ: Technical Architecture").
2. "category": A concise domain category (e.g., "Enterprise AI", "Cloud Infrastructure", "Product Engineering", "Computer Vision", "Strategy & Research").
3. "summary": A crisp 2-3 sentence overview covering what was built, key problem addressed, and overall impact.
4. "content": A rich, comprehensive, factual breakdown. Include:
   - Problem Statement & Objectives
   - Technical Architecture, Frameworks & Tech Stack
   - System Design Decisions & Trade-offs
   - Measurable Results, Key Accomplishments & Metrics
   - Challenges Overcome and Key Learnings
5. "tags": Array of 3-6 relevant technical and domain tags (e.g. ["Docker", "MongoDB", "RAG", "LLMs", "Azure"]).

DOCUMENT CONTENT:
"""
${clippedText}
"""

Respond ONLY with valid JSON:
{
  "entries": [
    {
      "title": "string",
      "category": "string",
      "summary": "string",
      "content": "string",
      "tags": ["string"]
    }
  ]
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
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed.entries) ? parsed.entries : [];

  if (list.length === 0) {
    return chunkDocumentHeuristically(docText, fileName);
  }

  return list.map((item, idx) => ({
    title: item.title || `${fileName.replace(/\.[^/.]+$/, '')} - Part ${idx + 1}`,
    category: item.category || 'Document Knowledge',
    summary: item.summary || item.title || 'Extracted knowledge item.',
    content: item.content || item.summary || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));
}

/**
 * Fallback semantic chunking for documents when LLM is unavailable.
 */
function chunkDocumentHeuristically(docText, fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const paragraphs = docText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (paragraphs.length === 0) {
    return [
      {
        title: baseName,
        category: 'Document Knowledge',
        summary: `Documented knowledge from ${fileName}`,
        content: docText.slice(0, 3000),
        tags: [baseName],
      },
    ];
  }

  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (currentWordCount + words > 400 && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [para];
      currentWordCount = words;
    } else {
      currentChunk.push(para);
      currentWordCount += words;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks.map((chunk, index) => {
    const firstLine = chunk.split('\n')[0] || '';
    const title = firstLine.length > 5 && firstLine.length < 70
      ? firstLine.replace(/^[#\-\*\s]+/, '')
      : `${baseName} (Section ${index + 1})`;

    return {
      title,
      category: 'Document Knowledge',
      summary: chunk.slice(0, 200).replace(/\n/g, ' ') + (chunk.length > 200 ? '…' : ''),
      content: chunk,
      tags: [baseName, `Section ${index + 1}`],
    };
  });
}

module.exports = { ingestDocumentForTwin, synthesizeDocumentWithLLM };
