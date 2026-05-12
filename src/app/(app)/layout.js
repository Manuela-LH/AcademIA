import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNavbar from "@/components/layout/AppNavbar";

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="h-screen bg-brand-blush/10 flex flex-col font-sans overflow-hidden">
      <AppNavbar user={user} />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="h-full w-full p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
