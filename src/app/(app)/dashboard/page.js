"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, MessageSquare, CheckCircle, Clock, Target, Hash, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  if (seconds < 60) return "< 1 min";
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalQuizTime: 0,
    totalChatTime: 0,
    subjectStats: []
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: quizzes, error: quizzesError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("user_id", user.id);

        if (quizzesError) throw quizzesError;

        const { data: subjects, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name, color")
          .eq("user_id", user.id);

        if (subjectsError) throw subjectsError;

        const { data: chatSessions, error: chatError } = await supabase
          .from("chat_sessions")
          .select("time_spent_seconds")
          .eq("user_id", user.id);

        if (chatError) throw chatError;

        // Calcular estadísticas de quizzes
        const totalQuizzes = quizzes?.length || 0;
        const completedQuizzesList = quizzes?.filter(q => q.completed_at) || [];
        const completedQuizzes = completedQuizzesList.length;
        
        const quizzesWithScore = quizzes?.filter(q => q.score != null) || [];
        const sumScore = quizzesWithScore.reduce((acc, q) => acc + Number(q.score), 0);
        const averageScore = quizzesWithScore.length > 0 ? (sumScore / quizzesWithScore.length).toFixed(1) : 0;
        
        const totalQuizTime = quizzes?.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0) || 0;
        
        // Calcular dominio por materia
        const subjectStats = subjects?.map(sub => {
          const subjectQuizzes = quizzesWithScore.filter(q => q.subject_id === sub.id);
          if (subjectQuizzes.length === 0) return null;
          
          const sum = subjectQuizzes.reduce((acc, q) => acc + Number(q.score), 0);
          const avg = Math.round(sum / subjectQuizzes.length);
          
          return {
            name: sub.name,
            score: avg,
            fill: sub.color || "#16697A", // Usa el color de la materia o brand-teal
          };
        }).filter(Boolean).sort((a, b) => b.score - a.score) || [];
        
        // Calcular estadísticas de chat
        const totalChatTime = chatSessions?.reduce((acc, session) => acc + (session.time_spent_seconds || 0), 0) || 0;

        setStats({
          totalQuizzes,
          completedQuizzes,
          averageScore: Number(averageScore),
          totalQuizTime,
          totalChatTime,
          subjectStats
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Error al cargar las estadísticas.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-teal mb-4" />
        <p className="text-brand-steel">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-10">
        <LayoutDashboard className="h-8 w-8 text-brand-teal" />
        <h1 className="text-3xl md:text-4xl font-black text-brand-taupe">Dashboard de Estudio</h1>
      </div>

      <div className="space-y-12">
        {/* Sección Quizzes */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-6 w-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-brand-taupe">Rendimiento en Quizzes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<Hash className="h-6 w-6 text-brand-teal" />}
              title="Total Realizados"
              value={stats.totalQuizzes}
            />
            <StatCard 
              icon={<CheckCircle className="h-6 w-6 text-brand-teal" />}
              title="Completados"
              value={stats.completedQuizzes}
            />
            <StatCard 
              icon={<Target className="h-6 w-6 text-brand-teal" />}
              title="Puntuación Media"
              value={`${stats.averageScore}%`}
            />
            <StatCard 
              icon={<Clock className="h-6 w-6 text-brand-teal" />}
              title="Tiempo en Quizzes"
              value={formatTime(stats.totalQuizTime)}
            />
          </div>
        </section>

        {/* Dominio por Materia */}
        {stats.subjectStats.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-6 w-6 text-brand-teal" />
              <h2 className="text-2xl font-bold text-brand-taupe">Dominio por Materia</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.subjectStats}
                  margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#77A0A9", fontSize: 12 }} 
                    dy={10}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#77A0A9", fontSize: 12 }} 
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: "#77A0A910" }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {stats.subjectStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Sección Chat */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-6 w-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-brand-taupe">Interacción con IA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              icon={<Clock className="h-6 w-6 text-brand-teal" />}
              title="Tiempo Total en Chat"
              value={formatTime(stats.totalChatTime)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-brand-steel/10 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-full bg-brand-blush/20 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm font-bold text-brand-steel mb-1">{title}</p>
      <p className="text-3xl font-black text-brand-taupe">{value}</p>
    </div>
  );
}
