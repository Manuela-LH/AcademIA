"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#16697A", "#DB93B0", "#77A0A9", "#E5A9A9", 
  "#8E7C68", "#546A7B", "#6B4D57", "#4A5D23"
];

export default function CreateSubjectModal({ isOpen, onClose, onSuccess, editingSubject }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name || "");
      setDescription(editingSubject.description || "");
      setColor(editingSubject.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
    }
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const url = "/api/subjects";
      const method = editingSubject ? "PUT" : "POST";
      const body = { name, description, color };
      if (editingSubject) body.id = editingSubject.id;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `Error al ${editingSubject ? 'actualizar' : 'crear'} la materia`);

      toast.success(`¡Materia ${editingSubject ? 'actualizada' : 'creada'} con éxito!`);
      onSuccess(data);
      onClose();
      // Limpiar campos solo si es creación
      if (!editingSubject) {
        setName("");
        setDescription("");
        setColor(PRESET_COLORS[0]);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-taupe/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-brand-steel/10">
        <div className="flex items-center justify-between p-6 border-b border-brand-steel/10">
          <h2 className="text-2xl font-black text-brand-taupe tracking-tight">
            {editingSubject ? "Editar Materia" : "Nueva Materia"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-blush/20 rounded-xl transition-colors group">
            <X className="h-6 w-6 text-brand-steel group-hover:text-brand-taupe" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-brand-taupe mb-2 ml-1">Nombre de la Materia</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cálculo Integral, Historia..."
              maxLength={100}
              className="w-full px-4 py-3.5 bg-brand-blush/10 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-taupe mb-2 ml-1">Descripción (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué estudiarás aquí?"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3.5 bg-brand-blush/10 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 transition-all resize-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-taupe mb-3 ml-1">Color Distintivo</label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-xl transition-all ${color === c ? 'ring-4 ring-brand-teal/20 scale-110 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-brand-steel/20 text-brand-taupe font-bold rounded-xl hover:bg-brand-blush/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-1 py-4 bg-brand-teal text-white font-bold rounded-xl hover:bg-[#0e4f5c] transition-colors shadow-lg shadow-brand-teal/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingSubject ? "Guardar Cambios" : "Crear Materia")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
