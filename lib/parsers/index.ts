import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedDocument } from '@/types';

// Polyfill browser globals required by pdf-parse/pdfjs-dist in Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() { return new Proxy(this, {}) }
  };
}
if (typeof globalThis.ImageData === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ImageData = class ImageData { };
}
if (typeof globalThis.Path2D === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Path2D = class Path2D { };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

// Minimum word count from pdf-parse before we consider the PDF image-heavy
// and fall back to Gemini OCR.
const OCR_FALLBACK_THRESHOLD = 100;

/**
 * Extract text from a PDF using Gemini's native multimodal understanding.
 * This handles image-heavy, scanned, or presentation-style PDFs that have
 * little or no text layer for pdf-parse to read.
 */
async function parsePDFWithGemini(buffer: Buffer): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const base64 = buffer.toString('base64');

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64,
      },
    },
    {
      text: `Extract and transcribe ALL text content from this PDF document, including text visible inside screenshots, images, tables, and diagrams. Preserve the logical reading order and structure. Return only the extracted text — no commentary, no summaries, no additional explanation. If a section is a screenshot of code or a UI, transcribe the visible text faithfully.`,
    },
  ]);

  return result.response.text().trim();
}

/**
 * Parse PDF file.
 * Strategy:
 *   1. Use pdf-parse to extract the native text layer (fast, free).
 *   2. If the result is sparse (< OCR_FALLBACK_THRESHOLD words), the PDF is
 *      likely image-heavy or scanned. Fall back to Gemini multimodal OCR.
 */
export async function parsePDF(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text: string = '';
  let pageCount = 0;

  try {
    // If PDF is very large, parsing it locally with pdf-parse is likely to Crash/OOM the Next.js process or block the event loop.
    // > 4MB goes straight to Gemini.
    if (file.size > 4 * 1024 * 1024) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds safe local parsing threshold. Deferring to Gemini.`);
    }

    const result = await pdf(buffer, { max: 100 }); // limit to 100 pages locally
    text = result.text.replace(/\0/g, '').trim();
    pageCount = result.numpages || result.total || 0;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[parsePDF] Skipping local pdf-parse: ${errorMsg}`);
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < OCR_FALLBACK_THRESHOLD) {
    // PDF has little or no extractable text, or we skipped local parsing — use Gemini vision OCR
    text = await parsePDFWithGemini(buffer);
    text = text.replace(/\0/g, '').trim();
  }

  return {
    text,
    metadata: {
      title: file.name,
      pageCount,
      format: 'PDF',
    },
  };
}

/**
 * Parse DOCX file
 */
export async function parseDOCX(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    text: result.value.trim(),
    metadata: {
      title: file.name,
      format: 'DOCX',
    },
  };
}

/**
 * Parse XLSX file
 */
export async function parseXLSX(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  let fullText = '';

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_txt(sheet, { blankrows: false });
    fullText += `=== ${sheetName} ===\n${sheetData}\n\n`;
  });

  return {
    text: fullText.trim(),
    metadata: {
      title: file.name,
      format: 'XLSX',
    },
  };
}

/**
 * Parse plain text file
 */
export async function parseTXT(file: File): Promise<ParsedDocument> {
  const text = await file.text();

  return {
    text: text.trim(),
    metadata: {
      title: file.name,
      format: 'TXT',
    },
  };
}

/**
 * Main document parser - auto-detects format
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileType = file.type;

  switch (fileType) {
    case 'application/pdf':
      return parsePDF(file);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return parseDOCX(file);

    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return parseXLSX(file);

    case 'text/plain':
      return parseTXT(file);

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Chunk text for embedding
 * Splits text into smaller chunks with overlap for better context
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];

  // Split by paragraphs first (double newlines)
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds max size, save current chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5)); // Approximate word count
      currentChunk = overlapWords.join(' ') + '\n\n' + paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (text too short), return as single chunk
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text.trim());
  }

  return chunks;
}

/**
 * Extract metadata from document text
 */
export function extractMetadata(text: string, filename: string): {
  subject?: string;
  language: string;
} {
  // Simple heuristic for subject detection
  const subjectKeywords: Record<string, string[]> = {
    mathematics: ['math', 'calculus', 'algebra', 'geometry', 'trigonometry', 'equation'],
    science: ['biology', 'chemistry', 'physics', 'experiment', 'hypothesis'],
    programming: ['code', 'function', 'class', 'variable', 'algorithm', 'programming'],
    literature: ['author', 'novel', 'poem', 'literature', 'story', 'character'],
    history: ['history', 'century', 'war', 'kingdom', 'ancient', 'civilization'],
  };

  let detectedSubject: string | undefined;
  const lowerText = text.toLowerCase();

  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matchCount >= 2) {
      detectedSubject = subject;
      break;
    }
  }

  // Simple language detection (very basic)
  let language = 'en'; // Default to English

  // Check for common words in other languages
  const malayWords = ['dan', 'atau', 'adalah', 'yang', 'dengan'];
  const indonesianWords = ['dan', 'atau', 'adalah', 'yang', 'dengan'];
  const vietnameseWords = ['và', 'hoặc', 'là', 'của', 'với'];
  const thaiWords = ['และ', 'หรือ', 'คือ', 'ของ', 'กับ'];

  if (malayWords.some(word => lowerText.includes(word))) language = 'ms';
  if (indonesianWords.some(word => lowerText.includes(word))) language = 'id';
  if (vietnameseWords.some(word => lowerText.includes(word))) language = 'vi';
  if (thaiWords.some(word => lowerText.includes(word))) language = 'th';

  return {
    subject: detectedSubject,
    language,
  };
}
