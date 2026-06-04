"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        toast.error("Error al enviar el correo: " + error.message);
        return;
      }

      setSent(true);
      toast.success("Correo enviado. Si el correo está registrado y verificado, recibirás un enlace para restablecer tu contraseña.");
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
            <h2 className="text-3xl font-extrabold text-brand-taupe text-center">Recuperar Contraseña</h2>
            <p className="text-brand-steel font-medium text-center mt-2">
              Ingresa tu correo electrónico para recibir un enlace de recuperación
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Si el correo ingresado está registrado y verificado, recibirás un enlace para restablecer tu contraseña.
                Revisa también tu bandeja de spam.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal hover:bg-[#0e4f5c] text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 text-lg shadow-lg shadow-brand-teal/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-brand-teal font-bold hover:underline text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
