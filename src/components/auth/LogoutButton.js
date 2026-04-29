"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Sesión cerrada correctamente");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión: " + error.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="p-2 text-brand-steel hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
      title="Cerrar sesión"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
