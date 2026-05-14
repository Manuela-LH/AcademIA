export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/rag/extractor";
import { createChunks } from "@/lib/rag/chunker";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const subjectId = formData.get("subjectId");

    if (!file || !subjectId) {
      return NextResponse.json({ error: "Falta el archivo o el subjectId." }, { status: 400 });
    }

    // 1. Verificar Autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar la clave del usuario guardada en user_metadata
    const apiKey = user.user_metadata?.gemini_api_key;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "Debes configurar tu API Key de Gemini en los ajustes antes de subir documentos." 
      }, { status: 400 });
    }

    // 2. Extraer texto del archivo
    let text = "";
    try {
      text = await extractTextFromFile(file, apiKey);
      console.log(`[Upload Debug] Texto extraído: ${text?.length || 0} caracteres`);
    } catch (e) {
      console.error("[Upload Debug] Error en extracción:", e.message);
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // 3. Crear chunks
    const chunks = createChunks(text);
    console.log(`[Upload Debug] Chunks generados: ${chunks.length}`);

    if (chunks.length === 0) {
      return NextResponse.json({ 
        error: `No se pudo extraer texto válido del documento. (Texto extraído: ${text?.length || 0} caracteres)`,
        textPreview: text ? text.substring(0, 100) : "Nulo"
      }, { status: 400 });
    }

    console.log(`[Upload Debug] Insertando documento en BD para subjectId: ${subjectId}`);
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        subject_id: subjectId,
        user_id: user.id,
        name: file.name,
        file_type: file.name.split('.').pop().toLowerCase(),
        storage_path: `mock_path/${file.name}`,
        size_bytes: file.size
      })
      .select()
      .single();

    if (docError) {
      console.error("[Upload Debug] Error insertando documento:", docError);
      return NextResponse.json({ error: `Error al registrar el documento: ${docError.message}` }, { status: 500 });
    }

    if (!docData) {
      console.error("[Upload Debug] No se devolvieron datos tras la inserción del documento.");
      return NextResponse.json({ error: "Error: No se pudo recuperar el documento insertado. Verifica las políticas RLS." }, { status: 500 });
    }

    console.log(`[Upload Debug] Documento registrado con ID: ${docData.id}`);

    // 5. Guardar los chunks (Sin embeddings - Long Context RAG)
    const chunksToInsert = chunks.map((chunkContent, i) => ({
      document_id: docData.id,
      subject_id: subjectId,
      user_id: user.id,
      content: chunkContent,
      chunk_index: i
    }));

    console.log(`[Upload Debug] Insertando ${chunksToInsert.length} chunks...`);
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunksToInsert);

    if (chunksError) {
      console.error("Error guardando chunks en BD:", chunksError);
      return NextResponse.json({ error: "Error guardando el contenido procesado." }, { status: 500 });
    }

    return NextResponse.json({ 
      documentId: docData.id, 
      chunksCreated: chunks.length, 
      message: "Procesamiento Long Context RAG completado exitosamente." 
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    );
  }
}
