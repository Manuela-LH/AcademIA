"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  Lock,
  Key,
  Mail,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  ExternalLink,
  Trash2,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();

  // --- User state ---
  const [userEmail, setUserEmail] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Name form ---
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // --- Password form ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // --- API Key form ---
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [isClearingKey, setIsClearingKey] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
        setCurrentName(name);
        setNewName(name);
        setHasApiKey(!!user.user_metadata?.gemini_api_key);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // --- Handlers ---
  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }
    if (trimmed === currentName) {
      toast.info("No has cambiado el nombre.");
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el nombre.");
      toast.success("Nombre actualizado correctamente.");
      setCurrentName(trimmed);
      // Trigger a router refresh so the server layout (AppNavbar) picks up the new name
      // We use a soft approach: update via supabase client as well to refresh auth state
      await supabase.auth.refreshSession();
      // Force a page reload of the layout by using window.location
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Introduce una nueva contraseña.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña.");
      toast.success("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      toast.error("Ingresa una API Key de Gemini.");
      return;
    }
    setIsVerifyingKey(true);
    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "La API Key no es válida.");
      toast.success(data.message || "API Key verificada y guardada.");
      setApiKeyInput("");
      setHasApiKey(true);
      await supabase.auth.refreshSession();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    setIsClearingKey(true);
    try {
      const res = await fetch("/api/user/clear-api-key", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al borrar la API Key.");
      toast.success("API Key eliminada. Deberás configurarla de nuevo al usar el chat.");
      setHasApiKey(false);
      setApiKeyInput("");
      await supabase.auth.refreshSession();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsClearingKey(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-teal" />
        <p className="mt-4 text-brand-steel">Cargando ajustes...</p>
      </div>
    );
  }

  const initial = currentName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-brand-taupe">Ajustes</h1>
        <p className="text-brand-steel mt-1 font-medium">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm p-6 mb-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-brand-teal text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xl text-brand-taupe truncate">{currentName || "Sin nombre"}</p>
          <p className="text-sm text-brand-steel truncate">{userEmail}</p>
          {hasApiKey && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full mt-2">
              <CheckCircle className="h-3.5 w-3.5" />
              Gemini API Key configurada
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* ── SECTION: Nombre ── */}
        <section className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-steel/10 bg-brand-blush/10">
            <User className="h-5 w-5 text-brand-teal" />
            <h2 className="font-bold text-brand-taupe">Nombre de Usuario</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label htmlFor="settings-full-name" className="block text-sm font-bold text-brand-taupe mb-1.5">
                  Nombre completo
                </label>
                <input
                  id="settings-full-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={isSavingName}
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium disabled:opacity-60 bg-white text-brand-taupe"
                />
                <p className="text-xs text-brand-steel mt-1.5">
                  Este nombre aparecerá en la barra de navegación.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-[#0e4f5c] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {isSavingName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── SECTION: Correo (read-only) ── */}
        <section className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-steel/10 bg-brand-blush/10">
            <Mail className="h-5 w-5 text-brand-steel" />
            <h2 className="font-bold text-brand-taupe">Correo Electrónico</h2>
          </div>
          <div className="p-6">
            <div>
              <label htmlFor="settings-email" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Correo electrónico
              </label>
              <input
                id="settings-email"
                type="email"
                value={userEmail}
                readOnly
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-xl bg-brand-blush/5 text-brand-steel font-medium cursor-not-allowed"
              />
              <p className="text-xs text-brand-steel/70 mt-1.5">
                El correo electrónico no puede cambiarse.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION: Contraseña ── */}
        <section className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-steel/10 bg-brand-blush/10">
            <Lock className="h-5 w-5 text-brand-teal" />
            <h2 className="font-bold text-brand-taupe">Contraseña</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label htmlFor="settings-new-password" className="block text-sm font-bold text-brand-taupe mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="settings-new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSavingPassword}
                    className="w-full px-4 py-2.5 pr-12 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium disabled:opacity-60 bg-white text-brand-taupe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-steel hover:text-brand-taupe transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="settings-confirm-password" className="block text-sm font-bold text-brand-taupe mb-1.5">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="settings-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSavingPassword}
                    className="w-full px-4 py-2.5 pr-12 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium disabled:opacity-60 bg-white text-brand-taupe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-steel hover:text-brand-taupe transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">Las contraseñas no coinciden.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Las contraseñas coinciden.
                  </p>
                )}
              </div>

              <p className="text-xs text-brand-steel">Mínimo 6 caracteres.</p>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-[#0e4f5c] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {isSavingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── SECTION: API Key ── */}
        <section className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-steel/10 bg-brand-blush/10">
            <Key className="h-5 w-5 text-brand-teal" />
            <h2 className="font-bold text-brand-taupe">Google Gemini API Key</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Current status */}
            {hasApiKey ? (
              <div className="flex items-center justify-between p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-teal shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand-teal">API Key configurada</p>
                    <p className="text-xs text-brand-steel">El tutor IA está disponible.</p>
                  </div>
                </div>
                <button
                  onClick={handleClearApiKey}
                  disabled={isClearingKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                >
                  {isClearingKey ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Eliminar Key
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-brand-blush/10 border border-brand-blush/30 rounded-xl">
                <Key className="h-5 w-5 text-brand-pink shrink-0" />
                <p className="text-sm text-brand-taupe">
                  No tienes una API Key configurada. Sin ella, no podrás usar el tutor IA.
                </p>
              </div>
            )}

            {/* Form to set/update API Key */}
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label htmlFor="settings-api-key" className="block text-sm font-bold text-brand-taupe mb-1.5">
                  {hasApiKey ? "Reemplazar API Key" : "Ingresar API Key"}
                </label>
                <p className="text-xs text-brand-steel mb-2">
                  AcademIA usa{" "}
                  <strong>Gemini 2.5 Flash</strong>. Necesitas proveer tu propia API Key gratuita.
                </p>
                <div className="relative">
                  <input
                    id="settings-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    disabled={isVerifyingKey}
                    className="w-full px-4 py-2.5 pr-12 border border-brand-steel/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium disabled:opacity-60 bg-white text-brand-taupe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-steel hover:text-brand-taupe transition-colors"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-teal flex items-center gap-1 hover:underline w-max"
              >
                Obtener una API Key gratuita <ExternalLink className="h-3 w-3" />
              </a>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isVerifyingKey || !apiKeyInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-[#0e4f5c] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {isVerifyingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  Verificar y Guardar
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
