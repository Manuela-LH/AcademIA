import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import LogoutButton from "@/components/auth/LogoutButton";
import Image from "next/image";

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-brand-blush/10 flex font-sans">
      <Sidebar userEmail={user.email} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-brand-teal text-white flex items-center justify-between px-6 border-b border-brand-steel/30 z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <Image src="/logo-academia.png" alt="Logo" width={24} height={24} style={{ width: "auto", height: "auto" }} />
            <span className="text-xl font-black tracking-tight uppercase">AcademIA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-brand-pink flex items-center justify-center font-black text-brand-taupe text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
