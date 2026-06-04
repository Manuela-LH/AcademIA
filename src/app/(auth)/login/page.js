"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
          toast.error(
            "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada y confirma tu cuenta antes de iniciar sesión."
          );
        } else {
          toast.error("Error al iniciar sesión: " + error.message);
        }
        return;
      }

      toast.success("¡Bienvenido de nuevo!");
      router.push("/subjects");
      router.refresh();
    } catch (err) {
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-blush/20 font-sans">
      <Navbar showAuthButtons={false} />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-brand-steel/10 p-8">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-3xl font-extrabold text-brand-taupe text-center">¡Bienvenido!</h2>
            <p className="text-brand-steel font-medium text-center mt-2">
              Inicia sesión para continuar con tu aprendizaje
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="••••••••"
              />
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-sm text-brand-teal font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal hover:bg-[#0e4f5c] text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 text-lg shadow-lg shadow-brand-teal/20"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-brand-taupe font-medium">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-brand-teal font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
