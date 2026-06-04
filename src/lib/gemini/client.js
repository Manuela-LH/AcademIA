import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = (apiKey) => {
  if (!apiKey) {
    throw new Error("Se requiere una API Key de Gemini válida.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const CHAT_MODEL = "gemini-2.5-flash";
export const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite"];

export const generateChatResponse = async (promptOrContents, systemInstruction, apiKey) => {
  const genAI = getGeminiClient(apiKey);

  // Try primary model first, then fallbacks
  const modelsToTry = [CHAT_MODEL, ...FALLBACK_MODELS];
  // Prepara la carga útil del request (string simple o array de contenidos)
  const requestPayload = Array.isArray(promptOrContents)
    ? { contents: promptOrContents }
    : promptOrContents;

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Intentando generar respuesta de chat con: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const result = await model.generateContentStream(requestPayload);
      return result.stream;
    } catch (error) {
      lastError = error;
      console.warn(`[generateChatResponse] El modelo ${modelName} falló: ${error.message}. Probando siguiente si está disponible...`);
      // Si el error es por cuota (429), podemos seguir al siguiente modelo inmediatamente.
    }
  }
  console.error(`[generateChatResponse] Todos los modelos fallaron. Último error: ${lastError?.message}`);
  throw lastError;
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
