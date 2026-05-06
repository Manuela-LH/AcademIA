// Force Node.js runtime — needed for pdf-parse and mammoth (CJS modules)
export const runtime = "nodejs";

import { analyzeImage } from "@/lib/gemini/client";

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
    // pdf-parse v1.1.1: bypass the package entry point (which tries to read a test
    // file at startup and breaks in Next.js) by calling the internal parser directly.
    try {
      const { createRequire } = await import("module");
      const req = createRequire(import.meta.url);
      const PDFParser = req("pdf-parse/lib/pdf-parse.js");
      const data = await PDFParser(buffer);
      console.log(`[Extractor] PDF extracted: ${data.text.length} chars`);
      return data.text;
    } catch (e) {
      console.error("[Extractor] pdf-parse error:", e.message);
      throw new Error(
        `No se pudo leer el PDF: ${e.message}. Intenta subir el archivo como .txt o .docx.`
      );
    }
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
