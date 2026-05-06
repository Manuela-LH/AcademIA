"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, LayoutDashboard, Brain } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import Image from "next/image";

export default function Sidebar({ userEmail }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/subjects", label: "Mis Materias", icon: BookOpen },
  ];

  const isActive = (href) => {
    return pathname === href;
  };

  return (
    <aside className="w-64 bg-brand-teal text-white flex flex-col hidden md:flex fixed h-full border-r border-brand-steel/10">
      <div className="h-24 flex items-center px-6 border-b border-brand-steel/10">
        <div className="bg-white p-2.5 rounded-2xl mr-3 shadow-sm border border-brand-steel/10 flex items-center justify-center">
          <Image src="/logo-academia.png" alt="Logo" width={32} height={32} style={{ width: "32px", height: "auto" }} />
        </div>
        <span className="text-xl font-extrabold tracking-tight">AcademIA</span>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isActive(href)
                ? "bg-white/20 text-white shadow-lg"
                : "hover:bg-white/10 text-brand-blush/80"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-brand-steel/10 bg-[#0e4f5c]/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-pink text-brand-taupe flex items-center justify-center font-black shrink-0 shadow-lg">
            {userEmail?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 truncate">
            <span className="block truncate text-xs font-bold opacity-70 uppercase tracking-widest mb-0.5">Estudiante</span>
            <span className="block truncate font-bold text-sm">{userEmail || "Usuario"}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
