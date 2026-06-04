"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import CreateSubjectModal from "@/components/subjects/CreateSubjectModal";
import DeleteConfirmModal from "@/components/documents/DeleteConfirmModal";

const Joyride = dynamic(
  () => import("react-joyride").then((mod) => ({ default: mod.Joyride })),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const openCreateModal = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  // Joyride states and configuration
  const [runTour, setRunTour] = useState(false);

  const steps = [
    {
      target: "#btn-nueva-materia",
      content: "Haz clic aquí para crear una nueva materia. Podrás asignarle un nombre, una descripción y un color único.",
      title: "Nueva Materia (1/4)",
      disableBeacon: true,
    },
    {
      target: "#nav-center-links",
      content: "Usa estos enlaces para moverte por la aplicación. Aquí puedes ir al Dashboard para ver tus estadísticas y rendimiento global.",
      title: "Navegación Principal (2/4)",
    },
    {
      target: "#user-menu-btn",
      content: "Haz clic en tu foto de perfil para acceder a tus ajustes, relanzar este tutorial en cualquier momento, o cerrar sesión.",
      title: "Menú de Usuario (3/4)",
    },
    {
      target: "#subjects-list-area",
      content: "Aquí aparecerán tus materias. Al hacer clic en cualquiera de ellas, entrarás a estudiar y podrás chatear con la IA, subir documentos y resolver quizzes.",
      title: "Tus Materias (4/4)",
    }
  ];

  const joyrideStyles = {
    options: {
      arrowColor: "#fff",
      backgroundColor: "#fff",
      overlayColor: "rgba(91, 75, 73, 0.4)",
      primaryColor: "#16697A",
      textColor: "#5B4B49",
      zIndex: 1000,
    },
    buttonNext: {
      backgroundColor: "#16697A",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "bold",
      padding: "10px 18px",
    },
    buttonBack: {
      color: "#77A0A9",
      marginRight: "10px",
      fontSize: "14px",
      fontWeight: "bold",
    },
    buttonSkip: {
      color: "#77A0A9",
      fontSize: "14px",
      fontWeight: "bold",
    },
    tooltipContainer: {
      textAlign: "left",
      borderRadius: "24px",
      padding: "8px",
    },
    tooltipTitle: {
      fontWeight: "900",
      fontSize: "18px",
      color: "#5B4B49",
      marginBottom: "8px",
    },
    tooltipContent: {
      fontSize: "14px",
      color: "#77A0A9",
    }
  };

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (["finished", "skipped"].includes(status)) {
      setRunTour(false);
      localStorage.setItem("tutorial_subjects_done", "true");
    }
  };

  const openEditModal = (e, subject) => {
    e.stopPropagation();
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubjects();
    setIsMounted(true);
  }, [fetchSubjects]);

  // Check localStorage for tutorial onboarding
  useEffect(() => {
    if (isMounted) {
      const isDone = localStorage.getItem("tutorial_subjects_done");
      if (!isDone) {
        setRunTour(true);
      }
    }
  }, [isMounted]);

  // Listen to profile dropdown "Tutorial" click event
  useEffect(() => {
    const startTutorial = () => {
      setRunTour(true);
    };
    window.addEventListener("run-page-tutorial", startTutorial);
    return () => window.removeEventListener("run-page-tutorial", startTutorial);
  }, []);

  const handleDeleteSubject = async (e, id, name) => {
    e.stopPropagation();
    setDeletingId(id);
    setDeletingName(name);
  };

  const confirmDeleteSubject = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/subjects?id=${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al eliminar");
      }
      toast.success("Materia eliminada");
      fetchSubjects();
    } catch (err) {
      console.error("Delete subject error:", err);
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setDeletingName("");
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-taupe tracking-tight">Mis Materias</h1>
          <p className="text-brand-steel font-medium text-lg mt-1">Gestiona tus áreas de estudio y documentos</p>
        </div>
        <button
          id="btn-nueva-materia"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-brand-teal text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#0e4f5c] transition-all shadow-lg shadow-brand-teal/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="h-6 w-6" /> Nueva Materia
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-steel group-focus-within:text-brand-teal transition-colors" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-brand-steel/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-teal/5 shadow-sm transition-all text-brand-taupe font-medium placeholder:text-brand-steel/50"
        />
      </div>

      <div id="subjects-list-area">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative h-16 w-16 mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-brand-teal opacity-20" />
              <Loader2 className="h-16 w-16 animate-spin text-brand-teal absolute inset-0 [animation-delay:-0.5s]" />
            </div>
            <p className="text-brand-steel font-bold text-lg animate-pulse">Cargando tus materias...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] border border-brand-steel/5 text-center shadow-sm">
            <div className="w-20 h-20 bg-brand-blush/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-brand-steel opacity-40" />
            </div>
            <h3 className="text-2xl font-black text-brand-taupe mb-2">
              {searchTerm ? "No hay resultados" : "Tu biblioteca está vacía"}
            </h3>
            <p className="text-brand-steel font-medium max-w-xs mx-auto">
              {searchTerm ? "Intenta con otro término de búsqueda." : "Comienza creando tu primera materia para organizar tus documentos."}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="mt-8 text-brand-teal font-bold hover:underline"
              >
                Crear materia ahora
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => router.push(`/subjects/${subject.id}`)}
                className="group relative bg-white p-8 rounded-[2rem] border border-brand-steel/5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                  <button
                    type="button"
                    onClick={(e) => openEditModal(e, subject)}
                    className="p-2.5 text-brand-steel/40 hover:text-brand-teal hover:bg-brand-teal/10 rounded-xl transition-all"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSubject(e, subject.id, subject.name)}
                    disabled={deletingId === subject.id}
                    className="p-2.5 text-brand-steel/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    {deletingId === subject.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg"
                  style={{ backgroundColor: subject.color }}
                >
                  <BookOpen className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-black text-brand-taupe mb-3 group-hover:text-brand-teal transition-colors tracking-tight">
                  {subject.name}
                </h3>

                <div className="flex items-center gap-3 text-sm font-bold text-brand-steel/60">
                  <span className="bg-brand-blush/20 px-3 py-1 rounded-lg truncate max-w-[200px]">{subject.description || "Sin descripción"}</span>
                  <span className="w-1 h-1 bg-brand-steel/30 rounded-full"></span>
                  <span>{isMounted ? new Date(subject.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                </div>

                <div className="mt-8 flex items-center text-brand-teal font-bold text-sm opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Entrar a estudiar
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSubjects}
        editingSubject={editingSubject}
      />

      <DeleteConfirmModal
        isOpen={deletingId !== null}
        documentName={deletingName}
        title="¿Borrar materia?"
        message="Se borrarán permanentemente todos los documentos y chats asociados."
        confirmText="Confirmar Borrado"
        isDeleting={isDeleting}
        onConfirm={confirmDeleteSubject}
        onCancel={() => setDeletingId(null)}
      />

      {isMounted && (
        <Joyride
          steps={steps}
          run={runTour}
          continuous={true}
          showSkipButton={true}
          showCloseButton={false}
          styles={joyrideStyles}
          callback={handleJoyrideCallback}
          locale={{
            back: "Atrás",
            close: "Cerrar",
            last: "Finalizar",
            next: "Siguiente",
            skip: "Omitir"
          }}
        />
      )}
    </div>
  );
}
