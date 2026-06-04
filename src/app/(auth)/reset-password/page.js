"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        toast.error("Sesión no válida o expirada. Solicita un nuevo enlace de recuperación.");
        router.push("/forgot-password");
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error("Error al restablecer la contraseña: " + error.message);
        return;
      }

      toast.success("Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.");
      router.push("/login");
    } catch (err) {
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-blush/20 font-sans">
        <Navbar showAuthButtons={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-blush/20 font-sans">
      <Navbar showAuthButtons={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-brand-steel/10 p-8">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-3xl font-extrabold text-brand-taupe text-center">Restablecer Contraseña</h2>
            <p className="text-brand-steel font-medium text-center mt-2">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Nueva Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal hover:bg-[#0e4f5c] text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 text-lg shadow-lg shadow-brand-teal/20"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Restablecer contraseña"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-brand-taupe font-medium">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="text-brand-teal font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
