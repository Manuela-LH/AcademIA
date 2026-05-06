"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Loader2, Trash2, Info, Key } from "lucide-react";
import { toast } from "sonner";
import FileUploader from "@/components/documents/FileUploader";
import DeleteConfirmModal from "@/components/documents/DeleteConfirmModal";
import ChatWindow from "@/components/chat/ChatWindow";
import ApiKeyModal from "@/components/chat/ApiKeyModal";
import { createClient } from "@/lib/supabase/client";

const TECHNIQUES_DESC = {
  neutral: "Explicación Estándar: Obtén respuestas claras y directas basadas en tus documentos.",
  socratic: "Método Socrático: La IA no te dará la respuesta directamente, sino que te hará preguntas para que tú mismo llegues a la conclusión.",
  feynman: "Técnica de Feynman: Conceptos complejos explicados de la forma más sencilla posible, ideal para cuando un tema se hace difícil.",
  breakdown: "Desglose Paso a Paso: Para problemas o procesos largos, la IA te explicará parte por parte sin abrumarte.",
  spaced: "Práctica Espaciada: La IA relacionará tus preguntas actuales con otros conceptos del documento para reforzar tu memoria."
};

export default function SubjectChatPage({ params }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  
  const [subject, setSubject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [technique, setTechnique] = useState("neutral");

  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.gemini_api_key) {
        setHasApiKey(true);
      } else {
        // Abrir modal automáticamente si no tiene API Key al entrar
        setIsApiKeyModalOpen(true);
      }

      // Obtener materia de la base de datos
      const { data: sub } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();
      
      if (sub) {
        setSubject(sub);
      } else {
        setSubject({
          name: "Materia de Estudio",
          description: "Carga tus documentos para empezar a aprender con IA.",
          color: "#16697A"
        });
      }

      // Obtener documentos de la materia
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });
        
      if (docs) {
        setDocuments(docs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const [deletingDocId, setDeletingDocId] = useState(null);
  const [deletingDocName, setDeletingDocName] = useState("");
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const handleDeleteDoc = (id, docName) => {
    setDeletingDocId(id);
    setDeletingDocName(docName);
    setIsDeletingDoc(false);
  };

  const confirmDelete = async () => {
    if (!deletingDocId) return;
    setIsDeletingDoc(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deletingDocId);

      if (error) throw error;
      
      toast.success("Documento eliminado");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeletingDoc(false);
      setDeletingDocId(null);
      setDeletingDocName("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-teal" />
        <p className="mt-4 text-brand-steel">Cargando material de estudio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link 
          href="/subjects" 
          className="p-2 bg-white border border-brand-steel/20 rounded-lg text-brand-taupe hover:text-brand-teal transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: subject?.color || "#16697A" }}
            ></div>
            <h1 className="text-2xl font-black text-brand-taupe">{subject?.name}</h1>
          </div>
          <p className="text-sm text-brand-steel">{subject?.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start min-h-screen">
        
        {/* LEFT SECTION: Upload and Document List */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
          <div className="shrink-0">
            <h2 className="text-lg font-bold text-brand-taupe mb-3">Añadir Nuevo Material</h2>
            <FileUploader subjectId={subjectId} onUploadSuccess={fetchData} />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            <h3 className="text-sm font-semibold text-brand-steel mt-4 mb-2">Documentos Subidos</h3>
            {documents.length === 0 ? (
              <div className="bg-white border border-dashed border-brand-steel/20 rounded-xl p-6 text-center">
                <FileText className="h-6 w-6 text-brand-steel/50 mx-auto mb-2" />
                <p className="text-xs text-brand-steel/70">Aún no hay documentos</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white p-3 rounded-xl border border-brand-steel/10 flex items-center justify-between group hover:border-brand-teal/30 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 h-8 w-8 bg-brand-pink/10 text-brand-pink rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-semibold text-sm text-brand-taupe truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[10px] text-brand-steel">
                        {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.name)}
                    disabled={deletingDocId === doc.id}
                    className="shrink-0 p-1.5 text-brand-steel hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingDocId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER SECTION: Chat Window */}
        <div className="lg:col-span-2 h-full flex flex-col relative">
          {!hasApiKey && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-2xl border border-brand-steel/20">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-steel/10 text-center max-w-sm">
                <Key className="h-10 w-10 text-brand-teal mx-auto mb-4" />
                <h3 className="text-xl font-bold text-brand-taupe mb-2">API Key Requerida</h3>
                <p className="text-sm text-brand-steel mb-6">Debes configurar tu API Key de Google Gemini para usar el tutor inteligente.</p>
                <button 
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="bg-brand-teal text-white font-bold py-2 px-4 rounded-lg hover:bg-[#0e4f5c] transition-colors w-full"
                >
                  Configurar API Key
                </button>
              </div>
            </div>
          )}
          <ChatWindow 
            subjectId={subjectId} 
            hasApiKey={hasApiKey} 
            technique={technique}
            setTechnique={setTechnique}
            onRequestApiKey={() => setIsApiKeyModalOpen(true)}
          />
        </div>

        {/* RIGHT SECTION: Info and Actions */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          
          <div className="bg-brand-blush/10 border border-brand-steel/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-brand-pink" />
              <h3 className="font-bold text-brand-taupe">Técnica Actual</h3>
            </div>
            <p className="text-sm text-brand-steel leading-relaxed">
              {TECHNIQUES_DESC[technique]}
            </p>
          </div>

          <div className="bg-white border border-brand-steel/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-brand-taupe mb-1">Cuestionarios</h3>
                <p className="text-xs text-brand-steel">Evalúa tu comprensión</p>
              </div>
              <div className="h-10 w-10 bg-brand-teal/10 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-brand-teal" />
              </div>
            </div>
            <button disabled className="w-full bg-brand-steel/10 text-brand-steel/60 font-semibold py-2 rounded-lg text-sm cursor-not-allowed">
              Próximamente
            </button>
          </div>

        </div>

      </div>

      <DeleteConfirmModal
        isOpen={deletingDocId !== null}
        documentName={deletingDocName}
        title="¿Borrar documento?"
        message="Esta acción no se puede deshacer."
        confirmText="Borrar"
        isDeleting={isDeletingDoc}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingDocId(null)}
      />

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSaveSuccess={() => {
          setHasApiKey(true);
          setIsApiKeyModalOpen(false);
        }} 
      />
    </div>
  );
}
