const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text content from uploaded file buffer based on mimetype or filename.
 * Supports PDF, DOCX, TXT, MD, JSON, CSV.
 */
async function extractTextFromFile(file) {
  if (!file) {
    throw new Error('No file provided for text extraction.');
  }

  const filename = (file.originalname || file.name || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();
  const buffer = file.buffer;

  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  let text = '';

  if (mimetype.includes('pdf') || filename.endsWith('.pdf')) {
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text || '';
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  } else if (
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('msword') ||
    filename.endsWith('.docx') ||
    filename.endsWith('.doc')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } catch (err) {
      throw new Error(`Failed to parse Word document: ${err.message}`);
    }
  } else if (
    mimetype.includes('text') ||
    mimetype.includes('json') ||
    filename.endsWith('.txt') ||
    filename.endsWith('.md') ||
    filename.endsWith('.markdown') ||
    filename.endsWith('.json') ||
    filename.endsWith('.csv')
  ) {
    text = buffer.toString('utf-8');
  } else {
    // Fallback: attempt UTF-8 decode
    text = buffer.toString('utf-8');
  }

  // Clean and normalize text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned || cleaned.length < 10) {
    throw new Error('Could not extract readable text from the uploaded document. Please check the file format.');
  }

  return cleaned;
}

module.exports = { extractTextFromFile };
