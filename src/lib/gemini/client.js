import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = (apiKey) => {
  if (!apiKey) {
    throw new Error("Se requiere una API Key de Gemini válida.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const CHAT_MODEL = "gemini-2.5-flash";
export const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"];

export const generateChatResponse = async (promptOrContents, systemInstruction, apiKey) => {
  const genAI = getGeminiClient(apiKey);

  const modelName = CHAT_MODEL;
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  // Acepta un string simple o un array de contents para conversaciones multi-turno
  const requestPayload = Array.isArray(promptOrContents)
    ? { contents: promptOrContents }
    : promptOrContents;

  try {
    const result = await model.generateContentStream(requestPayload);
    return result.stream;
  } catch (error) {
    console.error(`[generateChatResponse] Error con ${modelName}: ${error.message}`);
    throw error;
  }
};

/**
 * Analiza una imagen usando Gemini con mecanismo de reintento (Fallback).
 */
export const analyzeImage = async (buffer, mimeType, apiKey) => {
  const genAI = getGeminiClient(apiKey);
  
  // Lista de modelos a intentar en orden de preferencia
  const modelsToTry = FALLBACK_MODELS;
  
  const prompt = `
    Eres un experto en extracción de información académica. 
    Analiza esta imagen detalladamente:
    1. Transcribe TODO el texto que aparezca de forma clara y organizada.
    2. Si hay diagramas, mapas, tablas o dibujos, describe qué representan y su contenido.
    3. Si es una foto de un pizarrón o apuntes a mano, intenta descifrar la caligrafía lo mejor posible.
    
    Entrega un resultado estructurado que sirva como material de estudio.
  `;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Intentando analizar imagen con: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini] Análisis exitoso con: ${modelName}`);
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini] El modelo ${modelName} falló: ${error.message}. Probando siguiente si está disponible...`);
      // Continuar al siguiente modelo en la lista
    }
  }

  throw new Error(`No se pudo procesar la imagen tras varios intentos. Último error: ${lastError?.message}`);
};

/**
 * Analiza un documento (PDF, etc.) usando Gemini.
 */
export const analyzeDocument = async (buffer, mimeType, apiKey) => {
  const genAI = getGeminiClient(apiKey);
  
  const modelsToTry = FALLBACK_MODELS;
  
  const prompt = `
    Eres un experto en extracción de información académica. 
    Analiza este documento detalladamente:
    1. Extrae TODO el texto de forma clara, manteniendo la estructura original en párrafos y listas.
    2. Si hay imágenes, diagramas o tablas incrustadas en el documento, describe su contenido y su relación con el texto.
    3. Asegúrate de no omitir información importante, ya que se usará para generar cuestionarios y tutorías.
    
    Solo devuelve el contenido estructurado, sin introducciones ni saludos.
  `;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Intentando analizar documento con: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini] Análisis de documento exitoso con: ${modelName}`);
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini] El modelo ${modelName} falló: ${error.message}. Probando siguiente si está disponible...`);
    }
  }

  throw new Error(`No se pudo procesar el documento tras varios intentos. Último error: ${lastError?.message}`);
};

export const validateApiKey = async (apiKey) => {
  const genAI = getGeminiClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    // Intentamos generar un solo token
    await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "hola" }] }],
      generationConfig: { maxOutputTokens: 1 }
    });
    return true;
  } catch (e) {
    throw e;
  }
};

export const generateContentWithFallback = async (prompt, generationConfig, apiKey) => {
  const genAI = getGeminiClient(apiKey);
  const modelsToTry = FALLBACK_MODELS;
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig
      });
      return result.response;
    } catch (error) {
      lastError = error;
      console.warn(`[generateContent] El modelo ${modelName} falló: ${error.message}. Probando siguiente...`);
    }
  }

  throw new Error(`No se pudo generar contenido. Último error: ${lastError?.message}`);
};
