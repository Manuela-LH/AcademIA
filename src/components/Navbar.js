import Link from "next/link";
import Image from "next/image";

export default function Navbar({ showAuthButtons = true }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-6xl">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
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
          <nav className="flex items-center gap-6">
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
        )}
      </div>
    </header>
  );
}
