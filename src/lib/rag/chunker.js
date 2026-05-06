export function createChunks(text, maxChunkSize = 800, overlap = 100) {
  if (!text || text.trim().length === 0) return [];

  // Limpiar el texto de múltiples saltos de línea innecesarios
  const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();
  
  // Dividir por párrafos idealmente
  const paragraphs = cleanText.split('\n\n');
  const chunks = [];
  
  let currentChunk = "";
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;

    // Si el párrafo en sí mismo es más grande que el tamaño del chunk,
    // tendríamos que dividirlo por oraciones, pero por simplicidad de este nivel,
    // lo agregaremos y dejaremos que se exceda un poco o lo partimos bruscamente.
    if (paragraph.length > maxChunkSize) {
      // Si ya hay algo en el chunk actual, lo guardamos primero
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      // Partir el párrafo gigante en pedazos más pequeños
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(start + maxChunkSize, paragraph.length);
        const piece = paragraph.slice(start, end);
        chunks.push(piece);
        start += (maxChunkSize - overlap);
      }
      continue;
    }

    // Si al agregar el párrafo superamos el límite
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      currentChunk = paragraph + "\n\n";
    } else {
      currentChunk += paragraph + "\n\n";
    }
  }

  // Agregar el último chunk si quedó algo
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
