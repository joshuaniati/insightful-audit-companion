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
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  // For text-based files, read directly
  const textTypes = [
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
  ];
  if (
    textTypes.some((t) => file.type.includes(t)) ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".csv")
  ) {
    return await file.text();
  }

  // For PDF files, extract text via pdf.js or fallback
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      return await extractPdfText(file);
    } catch (e) {
      console.warn("PDF extraction failed, using filename only:", e);
      return `[PDF file: ${file.name} - could not extract text. Size: ${(file.size / 1024).toFixed(1)}KB]`;
    }
  }

  // For docx or other formats, inform the AI
  return `[File: ${file.name}, Type: ${file.type || "unknown"}, Size: ${(file.size / 1024).toFixed(1)}KB - text extraction not supported for this format. Please upload PDF or text files for best results.]`;
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Use pdf.js if available
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    return `[PDF file: ${file.name} - pdf.js not loaded]`;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 30); // Limit to 30 pages
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    if (text.trim()) pages.push(`--- Page ${i} ---\n${text}`);
  }
  return pages.length > 0
    ? pages.join("\n\n")
    : `[PDF file: ${file.name} - no extractable text found (may be scanned/image-based)]`;
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

export async function analyseDocuments(
  regulationFiles: File[],
  documentFiles: File[],
  categories: string[],
  onProgress: (msg: string, pct: number) => void
): Promise<AuditResult> {
  onProgress("Extracting text from regulation files...", 10);
  const regTexts = await Promise.all(regulationFiles.map(extractTextFromFile));

  onProgress("Extracting text from audit documents...", 30);
  const docTexts = await Promise.all(documentFiles.map(extractTextFromFile));

  onProgress("Sending to AI for compliance analysis...", 50);

  const regContext =
    regTexts.length > 0
      ? regTexts
          .map((t, i) => `=== Regulation File ${i + 1}: ${regulationFiles[i].name} ===\n${t.slice(0, 8000)}`)
          .join("\n\n")
      : "No regulation files uploaded. Use your knowledge of SA regulations.";

  const docContext = docTexts
    .map((t, i) => `=== Document ${i + 1}: ${documentFiles[i].name} ===\n${t.slice(0, 12000)}`)
    .join("\n\n");

  const prompt = `You are an expert South African regulatory compliance auditor. Analyse the following documents against South African regulations.

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
    const response = await window.puter.ai.chat(prompt, {
      model: "claude-sonnet-4",
    });

    onProgress("Parsing AI results...", 90);

    const text = response.message.content[0].text;
    // Try to extract JSON from the response
    let jsonStr = text.trim();
    // Remove markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const result: AuditResult = JSON.parse(jsonStr);
    onProgress("Analysis complete!", 100);
    return result;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
    );
  }
}
