"use client";

import { useState } from "react";
import { Key, X, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ApiKeyModal({ isOpen, onClose, onSaveSuccess }) {
  const [apiKey, setApiKey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Por favor, ingresa una API Key.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "La API Key no es válida.");
      }

      toast.success(data.message || "API Key validada y guardada correctamente.");
      setApiKey("");
      onSaveSuccess();
      router.refresh(); // Refrescar para que el servidor también sepa que ya la tiene
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-taupe/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-brand-steel/20 animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-brand-blush/20 p-4 border-b border-brand-steel/20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand-teal font-bold">
            <Key className="h-5 w-5" />
            <span>Configurar Gemini API</span>
          </div>
          <button
            onClick={onClose}
            className="text-brand-steel hover:text-brand-taupe transition-colors"
            disabled={isVerifying}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-brand-taupe text-sm mb-4 space-y-1">
            <p>
              AcademIA utiliza el modelo <strong>Gemini 2.5 Flash</strong> para funcionar.
              Como este es un proyecto académico, necesitas proveer tu propia API Key gratuita.
            </p>
            <p className="font-medium text-brand-teal mt-3 mb-1">Pasos para obtenerla:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Ve al link en la parte inferior.</li>
              <li>Inicia sesión con tu cuenta de Google</li>
              <li>Haz clic en "Create API Key"</li>
              <li>Selecciona o crea un proyecto en Google Cloud</li>
              <li>Copia la clave generada (empieza con "AIzaSy...")</li>
              <li>Pégala aquí abajo y presiona "Verificar y Guardar"</li>
            </ol>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-brand-taupe mb-1">
                Google Gemini API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                disabled={isVerifying}
                className="w-full px-4 py-2 border border-brand-steel/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:opacity-50"
              />
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-teal flex items-center gap-1 hover:underline w-max"
            >
              Obtener una API Key gratuita <ExternalLink className="h-3 w-3" />
            </a>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="px-4 py-2 text-sm font-medium text-brand-taupe hover:bg-brand-blush/10 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 text-sm font-medium bg-brand-teal hover:bg-[#0e4f5c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar y Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
