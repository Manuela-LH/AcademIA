"use client";

import { Loader2, Trash2 } from "lucide-react";

export default function DeleteConfirmModal({
  isOpen,
  title = "¿Borrar elemento?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Borrar",
  documentName,
  isDeleting,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-taupe/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mx-auto mb-6">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-black text-brand-taupe text-center mb-2">{title}</h2>
          <p className="text-brand-steel text-center font-medium mb-8 leading-relaxed">
            {documentName ? (
              <>Estás a punto de eliminar <span className="text-brand-taupe font-bold">"{documentName}"</span>. {message}</>
            ) : message}
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-3 border border-brand-steel/10 text-brand-taupe font-bold rounded-xl hover:bg-brand-blush/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
