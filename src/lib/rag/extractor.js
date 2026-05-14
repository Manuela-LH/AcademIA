// Force Node.js runtime — needed for pdf-parse and mammoth (CJS modules)
export const runtime = "nodejs";

import { analyzeImage, analyzeDocument } from "@/lib/gemini/client";

export async function extractTextFromFile(file, apiKey = null) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "";
  const fileName = file.name?.toLowerCase() || "";

  // --- IMÁGENES ---
  if (mimeType.startsWith("image/")) {
    if (!apiKey) {
      throw new Error("Se requiere una API Key de Gemini para procesar imágenes.");
    }
    console.log(`[Extractor] Processing IMAGE with Gemini: ${fileName}`);
    return await analyzeImage(buffer, mimeType, apiKey);
  }

  // --- TXT ---
  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    const text = buffer.toString("utf-8");
    console.log(`[Extractor] TXT extracted: ${text.length} chars`);
    return text;
  }

  // --- DOCX ---
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const mammoth = req("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    console.log(`[Extractor] DOCX extracted: ${result.value.length} chars`);
    return result.value;
  }

  // --- PDF ---
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    try {
      console.log(`[Extractor] Attempting to parse PDF with pdf-parse...`);
      const { createRequire } = await import("module");
      const req = createRequire(import.meta.url);
      const PDFParser = req("pdf-parse/lib/pdf-parse.js");
      const data = await PDFParser(buffer);
      
      // Si el parser devuelve texto válido y extenso, lo usamos.
      // Si el PDF es escaneado o tiene muy poco texto (ej. < 50 chars), usamos Gemini.
      if (data && data.text && data.text.trim().length > 50) {
        console.log(`[Extractor] PDF extracted: ${data.text.length} chars via pdf-parse`);
        return data.text;
      } else {
        console.log(`[Extractor] pdf-parse devolvió texto insuficiente (${data?.text?.length || 0} chars). Usando Gemini Fallback...`);
      }
    } catch (e) {
      console.warn("[Extractor] pdf-parse error, fallback to Gemini:", e.message);
    }

    // Fallback: Usar Gemini para PDFs escaneados o problemáticos
    if (!apiKey) {
      throw new Error("Se requiere una API Key de Gemini para procesar este PDF (parece ser un documento escaneado o complejo).");
    }
    console.log(`[Extractor] Processing PDF with Gemini Fallback: ${fileName}`);
    return await analyzeDocument(buffer, mimeType, apiKey);
  }

  // --- PPT / PPTX ---
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    fileName.endsWith(".pptx") ||
    fileName.endsWith(".ppt")
  ) {
    try {
      const { createRequire } = await import("module");
      const req = createRequire(import.meta.url);
      // office-text-extractor v2: getTextExtractor() returns an instance with .extractText()
      const { getTextExtractor } = req("office-text-extractor");
      const extractor = getTextExtractor();
      const text = await extractor.extractText({ input: buffer, type: "buffer" });
      console.log(`[Extractor] PPT/X extracted: ${text.length} chars`);
      return text;
    } catch (e) {
      console.error("[Extractor] office-text-extractor error:", e.message);
      throw new Error(
        `No se pudo leer el archivo de PowerPoint: ${e.message}. Intenta guardarlo como .pptx.`
      );
    }
  }

  throw new Error(
    `Tipo de archivo no soportado: ${mimeType || fileName}. Soporta PDF, DOCX, PPT/X y TXT.`
  );
}
