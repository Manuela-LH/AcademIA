"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Loader2, Clock, Target, Trash2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import DeleteConfirmModal from "@/components/documents/DeleteConfirmModal";

export default function QuizzesPage({ params }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [subject, setSubject] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editQuizName, setEditQuizName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const fetchData = async () => {
    try {
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();
      
      if (subjectData) setSubject(subjectData);

      const res = await fetch(`/api/quiz?subjectId=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
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

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al generar el cuestionario");
      }

      toast.success("¡Cuestionario generado!");
      router.push(`/subjects/${subjectId}/quizzes/${data.quizId}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmDeleteQuiz = async () => {
    if (!deletingQuiz) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quiz?id=${deletingQuiz.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Cuestionario eliminado");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setDeletingQuiz(null);
    }
  };

  const handleConfirmEditName = async () => {
    if (!editQuizName || !editQuizName.trim()) {
      toast.error("El nombre del cuestionario no puede estar vacío");
      return;
    }
    setIsEditingName(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: editingQuiz.id,
          name: editQuizName.trim()
        })
      });
      if (!res.ok) throw new Error("Error al actualizar el nombre");
      
      toast.success("Nombre del cuestionario actualizado");
      setEditingQuiz(null);
      setEditQuizName("");
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsEditingName(false);
    }
  };

  const handleQuizClick = (quiz) => {
    if (!quiz.completed_at) {
      router.push(`/subjects/${subjectId}/quizzes/${quiz.id}`);
    } else {
      setSelectedQuiz(quiz);
      setIsReviewModalOpen(true);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return "-";
    if (minutes < 1) return "< 1 min";
    return `${minutes} min`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/subjects/${subjectId}`}
            className="p-3 bg-white border border-brand-steel/10 rounded-xl text-brand-taupe hover:text-brand-teal hover:border-brand-teal/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-brand-taupe tracking-tight">
              Cuestionarios
            </h1>
            <p className="text-brand-steel font-medium">
              {subject?.name || "Cargando..."}
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 bg-brand-teal text-white px-6 py-3 md:py-4 rounded-2xl font-bold hover:bg-[#0e4f5c] transition-all shadow-lg shadow-brand-teal/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nuevo Cuestionario
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-brand-teal mb-4" />
          <p className="text-brand-steel font-bold">Cargando cuestionarios...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white p-16 rounded-[2.5rem] border border-brand-steel/5 text-center shadow-sm">
          <div className="w-20 h-20 bg-brand-blush/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-brand-steel opacity-40" />
          </div>
          <h3 className="text-2xl font-black text-brand-taupe mb-2">
            Sin cuestionarios aún
          </h3>
          <p className="text-brand-steel font-medium max-w-xs mx-auto">
            Crea tu primer cuestionario para evaluar tu comprensión del material.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => handleQuizClick(quiz)}
              className="group bg-white p-6 rounded-2xl border border-brand-steel/5 shadow-sm hover:shadow-md hover:border-brand-teal/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-brand-teal/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-brand-teal" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-taupe truncate">
                    {quiz.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-brand-steel/60">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(quiz.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(quiz.duration_minutes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`
                  px-4 py-2 rounded-xl font-bold text-sm
                  ${quiz.completed_at ? (quiz.score >= 70 ? 'bg-green-50 text-green-600' : 
                    quiz.score >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500') : 'bg-brand-teal/10 text-brand-teal'}
                `}>
                  {quiz.completed_at ? (
                    (() => {
                      const correctAnswers = quiz.user_answers?.filter(a => a.isCorrect).length || 0;
                      const totalQuestions = quiz.questions_json?.length || 0;
                      return `${correctAnswers}/${totalQuestions} (${quiz.score}%)`;
                    })()
                  ) : (
                    (() => {
                      const answered = quiz.user_answers?.length || 0;
                      const total = quiz.questions_json?.length || 0;
                      const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
                      return `En Proceso (${progress}%)`;
                    })()
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingQuiz(quiz);
                      setEditQuizName(quiz.name);
                    }}
                    style={{ color: "#DB93B0" }}
                    className="p-2.5 hover:bg-[#DB93B0]/10 rounded-xl transition-all"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingQuiz(quiz);
                    }}
                    className="p-2.5 text-brand-steel/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isReviewModalOpen && selectedQuiz && (
        <QuizReviewModal 
          quiz={selectedQuiz} 
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={deletingQuiz !== null}
        documentName={deletingQuiz?.name}
        title="¿Borrar cuestionario?"
        message="Esta acción no se puede deshacer."
        confirmText="Borrar"
        isDeleting={isDeleting}
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setDeletingQuiz(null)}
      />

      {editingQuiz && (
        <QuizEditModal
          quizName={editQuizName}
          onChangeName={setEditQuizName}
          isSaving={isEditingName}
          onConfirm={handleConfirmEditName}
          onCancel={() => {
            setEditingQuiz(null);
            setEditQuizName("");
          }}
        />
      )}
    </div>
  );
}

function QuizReviewModal({ quiz, onClose }) {
  const questions = quiz.questions_json || [];
  const userAnswers = quiz.user_answers || [];

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-brand-taupe">{quiz.name}</h2>
            <p className="text-brand-steel font-medium">
              {quiz.completed_at ? (() => {
                const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
                return `Puntuación: ${correctAnswers}/${questions.length} (${quiz.score}%)`;
              })() : "Cuestionario no completado"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-brand-blush/20 rounded-xl hover:bg-brand-blush/40 transition-colors"
          >
            <svg className="w-5 h-5 text-brand-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers.find(a => a.questionIndex === idx);
            const isCorrect = userAnswer?.isCorrect;

            return (
              <div key={idx} className="border border-brand-steel/10 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="bg-brand-teal/10 text-brand-teal font-bold px-2 py-1 rounded-lg text-sm">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-brand-taupe flex-1">{q.question}</h3>
                  {isCorrect !== undefined && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? "Correcto" : "Incorrecto"}
                    </span>
                  )}
                </div>
                <div className="pl-10 space-y-1">
                  {q.options.map((opt, optIdx) => {
                    const isUserSelection = userAnswer?.selectedOption === optIdx;
                    const isCorrectOption = optIdx === q.correct;
                    
                    return (
                      <p key={optIdx} className={`text-sm py-1 px-2 rounded-md ${
                        isCorrectOption ? 'bg-green-50 text-green-700 font-medium' : 
                        (isUserSelection ? 'bg-red-50 text-red-700' : 'text-brand-steel')
                      }`}>
                        {isCorrectOption && <span className="font-bold mr-1">✓ (Correcta)</span>}
                        {isUserSelection && !isCorrectOption && <span className="font-bold mr-1">✗ (Tu elección)</span>}
                        {isUserSelection && isCorrectOption && <span className="font-bold mr-1">(Tu elección)</span>}
                        {opt}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizEditModal({ quizName, onChangeName, isSaving, onConfirm, onCancel }) {
  return (
    <div 
      onClick={onCancel}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] w-full max-w-md p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <h3 className="text-xl font-black text-brand-taupe mb-4">Editar nombre</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-steel/60 mb-2">
              Nombre del cuestionario
            </label>
            <input 
              type="text"
              value={quizName}
              onChange={(e) => onChangeName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-steel/20 focus:outline-none focus:border-brand-teal text-brand-taupe font-medium transition-all"
              placeholder="Ej. Cuestionario de Histología"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-5 py-3 border border-brand-steel/10 hover:border-brand-steel/30 text-brand-taupe font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isSaving || !quizName.trim()}
              className="px-5 py-3 bg-[#DB93B0] hover:bg-[#c97fa0] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}