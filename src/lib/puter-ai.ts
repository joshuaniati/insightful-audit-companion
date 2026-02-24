// Puter.ai integration for document analysis

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string,
          options?: { model?: string }
        ) => Promise<{ message: { content: { text: string }[] } }>;
      };
    };
    pdfjsLib?: any;
  }
}

// Supported file types and their handlers
interface FileHandler {
  extensions: string[];
  mimeTypes: string[];
  extract: (file: File) => Promise<string>;
}

async function extractTextFromFile(file: File): Promise<string> {
  const handlers: FileHandler[] = [
    // Plain text files
    {
      extensions: ['.txt', '.text', '.log', '.ini', '.cfg', '.conf', '.bat', '.sh', '.bash', '.zsh'],
      mimeTypes: ['text/plain'],
      extract: (f) => f.text()
    },
    
    // Code files
    {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.scss', '.less', 
                   '.php', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.rb', '.go', '.rs',
                   '.swift', '.kt', '.kts', '.json', '.xml', '.yaml', '.yml', '.toml'],
      mimeTypes: ['application/javascript', 'application/json', 'text/html', 'text/css', 
                  'application/xml', 'text/x-python', 'text/x-java', 'text/x-c'],
      extract: (f) => f.text()
    },
    
    // Markdown and documentation
    {
      extensions: ['.md', '.markdown', '.rst', '.tex', '.latex'],
      mimeTypes: ['text/markdown', 'text/x-rst'],
      extract: (f) => f.text()
    },
    
    // Data files
    {
      extensions: ['.csv', '.tsv', '.json', '.xml', '.yaml', '.yml'],
      mimeTypes: ['text/csv', 'text/tab-separated-values', 'application/json', 'application/xml'],
      extract: (f) => f.text()
    },
    
    // PDF files
    {
      extensions: ['.pdf'],
      mimeTypes: ['application/pdf'],
      extract: extractPdfText
    },
    
    // Microsoft Office
    {
      extensions: ['.docx', '.doc'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                  'application/msword'],
      extract: extractDocxText
    },
    
    // Excel files
    {
      extensions: ['.xlsx', '.xls', '.xlsm', '.xlsb'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.ms-excel'],
      extract: extractExcelText
    },
    
    // PowerPoint files
    {
      extensions: ['.pptx', '.ppt'],
      mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.ms-powerpoint'],
      extract: extractPptxText
    },
    
    // Rich Text Format
    {
      extensions: ['.rtf'],
      mimeTypes: ['application/rtf', 'text/rtf'],
      extract: extractRtfText
    },
    
    // Images (via OCR if possible)
    {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'],
      extract: extractImageText
    },
    
    // ZIP archives
    {
      extensions: ['.zip'],
      mimeTypes: ['application/zip'],
      extract: extractZipText
    }
  ];

  // Find matching handler
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const handler = handlers.find(h => 
    h.extensions.includes(extension) || 
    h.mimeTypes.includes(file.type)
  );

  if (handler) {
    try {
      onProgress?.(`Extracting text from ${file.name}...`, 0);
      const text = await handler.extract(file);
      
      // If we got meaningful text, return it
      if (text && text.length > 100) {
        return text;
      }
      
      // If extraction yielded little text, provide context
      return `[File: ${file.name}, Type: ${file.type || 'unknown'}, Size: ${(file.size / 1024).toFixed(1)}KB - Limited text extracted. Raw content: ${text || 'No text found'}]`;
    } catch (error) {
      console.warn(`Error extracting from ${file.name}:`, error);
      return `[File: ${file.name}, Type: ${file.type || 'unknown'}, Size: ${(file.size / 1024).toFixed(1)}KB - Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  // Fallback for unknown file types
  return `[File: ${file.name}, Type: ${file.type || 'unknown'}, Size: ${(file.size / 1024).toFixed(1)}KB - Unsupported file format. Please convert to PDF or text for analysis.]`;
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Try using pdf.js if available
  const pdfjsLib = (window as any).pdfjsLib;
  if (pdfjsLib) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      const maxPages = Math.min(pdf.numPages, 30);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        if (text.trim()) {
          pages.push(`--- Page ${i} ---\n${text}`);
        }
      }
      
      if (pages.length > 0) {
        return pages.join("\n\n");
      }
    } catch (error) {
      console.warn("pdf.js extraction failed:", error);
    }
  }
  
  // Fallback: try to extract metadata and first few bytes
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(uint8Array.slice(0, 10000));
    
    // Look for readable text in the PDF
    const matches = text.match(/[^\x00-\x1F\x7F-\xFF]{10,}/g);
    if (matches && matches.length > 0) {
      return `[Extracted from PDF binary: ${matches.slice(0, 20).join(' ')}]`;
    }
  } catch (e) {
    // Ignore binary decoding errors
  }
  
  return `[PDF file: ${file.name} - No extractable text found. File size: ${(file.size / 1024).toFixed(1)}KB. This may be a scanned/image-based PDF.]`;
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use JSZip if available
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      return `[DOCX file: ${file.name} - JSZip library not loaded. Please install JSZip for DOCX extraction.]`;
    }
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Extract document.xml which contains the text
    const docXml = await zip.file('word/document.xml')?.async('string');
    if (!docXml) {
      return `[DOCX file: ${file.name} - Invalid DOCX format]`;
    }
    
    // Simple XML tag stripping
    const text = docXml.replace(/<[^>]*>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
    
    return text || `[DOCX file: ${file.name} - No text content found]`;
  } catch (error) {
    console.warn("DOCX extraction failed:", error);
    return `[DOCX file: ${file.name} - Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

async function extractExcelText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      return `[Excel file: ${file.name} - XLSX library not loaded. Please install SheetJS/XLSX for Excel extraction.]`;
    }
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheets: string[] = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const text = XLSX.utils.sheet_to_txt(sheet);
      if (text.trim()) {
        sheets.push(`--- Sheet: ${sheetName} ---\n${text}`);
      }
    });
    
    return sheets.length > 0 ? sheets.join('\n\n') : `[Excel file: ${file.name} - No data found]`;
  } catch (error) {
    console.warn("Excel extraction failed:", error);
    return `[Excel file: ${file.name} - Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

async function extractPptxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      return `[PPTX file: ${file.name} - JSZip library not loaded]`;
    }
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slides: string[] = [];
    
    // Get all slide files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    ).sort();
    
    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async('string');
      if (slideXml) {
        const text = slideXml.replace(/<[^>]*>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
        if (text) {
          slides.push(`--- Slide ${slideFile.match(/\d+/)?.[0] || ''} ---\n${text}`);
        }
      }
    }
    
    return slides.length > 0 ? slides.join('\n\n') : `[PPTX file: ${file.name} - No text content found]`;
  } catch (error) {
    console.warn("PPTX extraction failed:", error);
    return `[PPTX file: ${file.name} - Extraction failed]`;
  }
}

async function extractRtfText(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Very basic RTF stripping - remove control words and groups
    const stripped = text.replace(/\\[a-z]+-?\d*|\\'[0-9a-f]{2}|\\\{|\\\}|\\\\|{\*?\\[^{}]+}|[{}]/gi, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
    return stripped || `[RTF file: ${file.name} - No readable text found]`;
  } catch (error) {
    return `[RTF file: ${file.name} - Extraction failed]`;
  }
}

async function extractImageText(file: File): Promise<string> {
  // Check if Tesseract is available for OCR
  const Tesseract = (window as any).Tesseract;
  if (Tesseract) {
    try {
      onProgress?.(`Performing OCR on ${file.name}...`, 0);
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            onProgress?.(`OCR progress: ${Math.round(m.progress * 100)}%`, 30 + Math.round(m.progress * 30));
          }
        }
      });
      
      if (result.data.text && result.data.text.trim().length > 0) {
        return `[OCR extracted text from ${file.name}:\n${result.data.text}]`;
      }
    } catch (error) {
      console.warn("OCR failed:", error);
    }
  }
  
  return `[Image file: ${file.name} - Size: ${(file.size / 1024).toFixed(1)}KB. For text extraction from images, please enable OCR or convert to PDF/text.]`;
}

async function extractZipText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      return `[ZIP file: ${file.name} - JSZip library not loaded]`;
    }
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const contents: string[] = [];
    let fileCount = 0;
    
    // Process first few text files in the zip
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (fileCount >= 5) break; // Limit to 5 files
      
      const entry = zipEntry as any;
      if (!entry.dir && (filename.endsWith('.txt') || filename.endsWith('.md') || filename.endsWith('.csv'))) {
        try {
          const content = await entry.async('string');
          contents.push(`--- File in ZIP: ${filename} ---\n${content.slice(0, 2000)}`);
          fileCount++;
        } catch (e) {
          // Skip binary files
        }
      }
    }
    
    if (contents.length > 0) {
      return `[ZIP archive: ${file.name} contains:\n${contents.join('\n\n')}]`;
    }
    
    return `[ZIP archive: ${file.name} - Contains ${Object.keys(zip.files).length} files. Extract and upload relevant documents for analysis.]`;
  } catch (error) {
    return `[ZIP file: ${file.name} - Extraction failed]`;
  }
}

export interface AuditFinding {
  severity: "high" | "medium" | "low" | "compliant";
  title: string;
  regulation: string;
  description: string;
  evidence?: string;
  recommendation?: string;
}

export interface AuditResult {
  totalFindings: number;
  highRisk: number;
  mediumRisk: number;
  compliant: number;
  opinion: "clean" | "qualified" | "adverse";
  findings: AuditFinding[];
}

let onProgress: ((msg: string, pct: number) => void) | undefined;

export async function analyseDocuments(
  regulationFiles: File[],
  documentFiles: File[],
  categories: string[],
  progressCallback: (msg: string, pct: number) => void
): Promise<AuditResult> {
  onProgress = progressCallback;
  
  progressCallback("Extracting text from regulation files...", 10);
  const regTexts = await Promise.all(regulationFiles.map(file => 
    extractTextFromFile(file).catch(err => `[Error extracting ${file.name}: ${err.message}]`)
  ));

  progressCallback("Extracting text from audit documents...", 30);
  const docTexts = await Promise.all(documentFiles.map(file => 
    extractTextFromFile(file).catch(err => `[Error extracting ${file.name}: ${err.message}]`)
  ));

  progressCallback("Preparing analysis context...", 50);

  // Build context with file summaries
  const regContext = regTexts.length > 0
    ? regTexts
        .map((t, i) => `=== Regulation File ${i + 1}: ${regulationFiles[i].name} ===\n${t.slice(0, 8000)}`)
        .join("\n\n")
    : "No regulation files uploaded. Use your knowledge of SA regulations.";

  const docContext = docTexts
    .map((t, i) => `=== Document ${i + 1}: ${documentFiles[i].name} ===\n${t.slice(0, 12000)}`)
    .join("\n\n");

  // Add file summary for context
  const fileSummary = `
File Summary:
- Regulations: ${regulationFiles.map(f => f.name).join(', ') || 'None'}
- Documents: ${documentFiles.map(f => f.name).join(', ') || 'None'}
- Total files: ${regulationFiles.length + documentFiles.length}
`;

  const prompt = `You are an expert South African regulatory compliance auditor. Analyse the following documents against South African regulations.

${fileSummary}

CATEGORIES TO CHECK: ${categories.join(", ")}

REGULATION REFERENCE MATERIAL:
${regContext}

DOCUMENTS TO AUDIT:
${docContext}

Provide your analysis as a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "totalFindings": <number>,
  "highRisk": <number of high severity findings>,
  "mediumRisk": <number of medium severity findings>,  
  "compliant": <number of compliant areas>,
  "opinion": "<clean|qualified|adverse>",
  "findings": [
    {
      "severity": "<high|medium|low|compliant>",
      "title": "<finding title>",
      "regulation": "<specific regulation section e.g. PFMA Section 40(1)(b)>",
      "description": "<detailed description of finding>",
      "evidence": "<evidence from the document or null>",
      "recommendation": "<recommendation to fix or null>"
    }
  ]
}

Rules:
- Be thorough but realistic based on the ACTUAL document content
- Reference specific sections of SA regulations (PFMA, POPIA, OHS Act, BCEA, King IV, NEMA, B-BBEE Act, etc.)
- Include both non-compliant findings AND compliant areas
- For compliant areas, set severity to "compliant" and omit recommendation
- opinion should be "clean" if no high/medium findings, "qualified" if some, "adverse" if many critical issues
- Return ONLY the JSON object, no other text`;

  try {
    progressCallback("Sending to AI for compliance analysis...", 70);
    
    const response = await window.puter.ai.chat(prompt, {
      model: "claude-sonnet-4",
    });

    progressCallback("Parsing AI results...", 90);

    const text = response.message.content[0].text;
    
    // Try to extract JSON from the response
    let jsonStr = text.trim();
    
    // Remove markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }
    
    // Find JSON object if there's other text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result: AuditResult = JSON.parse(jsonStr);
    
    // Validate result structure
    if (!result.findings || !Array.isArray(result.findings)) {
      throw new Error("Invalid response format: missing findings array");
    }
    
    progressCallback("Analysis complete!", 100);
    return result;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
    );
  }
}
