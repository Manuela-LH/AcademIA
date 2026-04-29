import Link from "next/link";
import Image from "next/image";
import { Zap, MessageSquare, TrendingUp, ArrowRight, FileText, Brain, BookOpen, LineChart, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="bg-brand-taupe py-24 md:py-32 flex flex-col items-center text-center px-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-pink/20 text-brand-pink text-xs font-bold tracking-wider mb-8 uppercase">
            <Zap className="h-3.5 w-3.5" />
            Impulsado por inteligencia artificial
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 max-w-4xl tracking-tight leading-tight">
            <span className="text-brand-steel">Tu coach de estudio</span>
            <br />
            <span className="text-brand-teal">personal</span> <span className="text-brand-steel">con IA</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-medium leading-relaxed">
            Optimiza tu aprendizaje con planes de estudio personalizados y apoyo constante. Diseñado para que alcances tu máximo potencial sin estrés.
          </p>

          <Link
            href="/register"
            className="bg-brand-teal hover:bg-[#0e4f5c] text-white px-8 py-3.5 rounded-md font-bold transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Empieza ahora <ArrowRight className="h-5 w-5" />
          </Link>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-brand-pink/10 rounded-2xl flex items-center justify-center mb-6 text-brand-pink">
                  <MessageSquare className="h-10 w-10 stroke-[1.5]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Apoyo 24/7</h3>
                <p className="text-gray-500 font-medium leading-relaxed max-w-xs">
                  Nunca te quedes con la duda. Nuestra IA está disponible en cualquier momento para ayudarte.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-brand-pink/10 rounded-2xl flex items-center justify-center mb-6 text-brand-pink">
                  <TrendingUp className="h-10 w-10 stroke-[1.5]" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Progreso Real</h3>
                <p className="text-gray-500 font-medium leading-relaxed max-w-xs">
                  Visualiza tu crecimiento académico con analíticas detalladas de tu evolución diaria.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-teal mb-12">Características Principales</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FileText, title: "Contexto Estricto", desc: "Cero alucinaciones. Solo respuestas basadas en tu material." },
                { icon: Brain, title: "Técnicas Activas", desc: "Métodos Socrático y Feynman integrados en el chat." },
                { icon: BookOpen, title: "Cuestionarios", desc: "Evaluaciones adaptativas generadas al instante." },
                { icon: LineChart, title: "Dashboard", desc: "Métricas claras de tu comprensión y tiempo de estudio." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 border border-brand-steel/20 rounded-xl hover:shadow-md transition-shadow">
                  <item.icon className="h-10 w-10 text-brand-teal mb-4" />
                  <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-brand-taupe">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo Funciona */}
        <section className="py-20 bg-brand-blush/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-teal mb-12">¿Cómo funciona AcademIA?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-brand-steel/20">
                <div className="h-16 w-16 bg-brand-teal/10 rounded-full flex items-center justify-center mb-6 text-brand-teal">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Sube tus materiales</h3>
                <p className="text-brand-taupe">Carga tus PDFs, documentos de Word, presentaciones o imágenes de tus clases.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-brand-steel/20">
                <div className="h-16 w-16 bg-brand-pink/20 rounded-full flex items-center justify-center mb-6 text-brand-pink">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Chatea y aprende</h3>
                <p className="text-brand-taupe">Interactúa con el tutor IA. Sus respuestas se basan estrictamente en tus documentos.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-brand-steel/20">
                <div className="h-16 w-16 bg-brand-steel/20 rounded-full flex items-center justify-center mb-6 text-brand-steel">
                  <LineChart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Mide tu progreso</h3>
                <p className="text-brand-taupe">Genera cuestionarios automáticos para poner a prueba tus conocimientos y ver métricas.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-academia.png" alt="AcademIA Logo" width={24} height={24} style={{ width: "auto", height: "auto" }} className="rounded-sm" />
            <span className="text-base font-bold text-brand-teal">Creadoras</span>
          </div>
          <div className="text-sm font-bold text-gray-400 flex gap-6">
            <span>Manuela Londoño H.</span>
            <span>Angely D. Brito A</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
