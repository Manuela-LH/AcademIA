"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast.error("Error al registrarse: " + error.message);
        return;
      }

      toast.success("¡Registro exitoso! Verifica tu correo electrónico o inicia sesión.");
      router.push("/login");
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
            <h2 className="text-3xl font-extrabold text-brand-taupe text-center">Crear Cuenta</h2>
            <p className="text-brand-steel font-medium text-center mt-2">
              Únete a AcademIA y mejora tus hábitos de estudio
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Nombre Completo
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="Tu Nombre"
              />
            </div>

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
            </div>
            
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-bold text-brand-taupe mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-brand-steel/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal hover:bg-[#0e4f5c] text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70 text-lg shadow-lg shadow-brand-teal/20"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registrarse"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-brand-taupe font-medium">
              ¿Ya tienes una cuenta?{' '}
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
