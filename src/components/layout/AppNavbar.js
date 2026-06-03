"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { LogOut, Settings, LayoutDashboard, BookOpen, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AppNavbar({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();

  // Derive initial display name from the server-passed user prop
  const getDisplayName = useCallback((u) => {
    return u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split("@")[0] || "Usuario";
  }, []);

  const [displayName, setDisplayName] = useState(() => getDisplayName(user));

  // Listen for profile update events dispatched from the settings page
  useEffect(() => {
    const handleProfileUpdate = async () => {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser) {
        setDisplayName(getDisplayName(freshUser));
      }
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
  }, [supabase, getDisplayName]);

  // Also listen to Supabase auth state changes to catch refreshSession calls
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setDisplayName(getDisplayName(session.user));
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, getDisplayName]);

  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Sesión cerrada correctamente");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión: " + error.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
        {/* Logo Left */}
        <Link href="/subjects" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo-academia.png"
            alt="AcademIA Logo"
            width={40}
            height={40}
            style={{ width: "40px", height: "auto" }}
            className="rounded-md"
          />
          <span className="text-2xl font-bold text-brand-teal tracking-tight">AcademIA</span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/subjects"
            className="flex items-center gap-2 text-sm font-bold text-brand-taupe hover:text-brand-teal transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Mis Materias
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-brand-taupe hover:text-brand-teal transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </nav>

        {/* Right Section: User Profile Dropdown */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <span className="hidden sm:block text-sm font-bold text-brand-taupe">{displayName}</span>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <div className="h-10 w-10 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {initial}
            </div>
            <ChevronDown className={`h-4 w-4 text-brand-steel transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in duration-150">
              <div className="md:hidden px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-xs font-bold text-brand-taupe truncate">{displayName}</p>
                <p className="text-[10px] text-brand-steel truncate">{user?.email}</p>
              </div>

              {/* Mobile Only Nav Items */}
              <div className="md:hidden px-1 space-y-1 mb-2">
                <Link
                  href="/subjects"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-brand-taupe hover:bg-brand-blush/20 hover:text-brand-teal rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  Mis Materias
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-brand-taupe hover:bg-brand-blush/20 hover:text-brand-teal rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>

              <div className="px-1 space-y-1">
                <Link
                  href="/settings"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-brand-taupe hover:bg-brand-blush/20 hover:text-brand-teal rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Ajustes
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
