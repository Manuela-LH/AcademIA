"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Navbar({ showAuthButtons = true }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-6xl">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
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
        
        {showAuthButtons && (
          <>
            {/* Desktop buttons */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/login" 
                className="text-sm font-bold text-brand-teal hover:text-[#0e4f5c] transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-bold bg-brand-teal text-white px-5 py-2.5 rounded-md hover:bg-[#0e4f5c] transition-colors"
              >
                Crear cuenta
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-brand-teal hover:bg-brand-teal/5 rounded-lg transition-colors"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {showAuthButtons && isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-4 space-y-3">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center text-sm font-bold text-brand-teal hover:text-[#0e4f5c] border border-brand-teal/20 px-5 py-2.5 rounded-md transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center text-sm font-bold bg-brand-teal text-white px-5 py-2.5 rounded-md hover:bg-[#0e4f5c] transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
