"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, MessageSquare, CheckCircle, Clock, Target, Hash, BarChart3, TrendingUp, Layers } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

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
  const [rawData, setRawData] = useState({ subjects: [], quizzes: [], chatSessions: [] });
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  
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
          .select("time_spent_seconds, subject_id")
          .eq("user_id", user.id);

        if (chatError) throw chatError;

        setRawData({
          subjects: subjects || [],
          quizzes: quizzes || [],
          chatSessions: chatSessions || []
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

  // Derivación de datos según el filtro
  const filteredQuizzes = selectedSubjectId === "all" 
    ? rawData.quizzes 
    : rawData.quizzes.filter(q => q.subject_id === selectedSubjectId);

  const filteredChatSessions = selectedSubjectId === "all"
    ? rawData.chatSessions
    : rawData.chatSessions.filter(c => c.subject_id === selectedSubjectId);

  // Rendimiento Quizzes
  const totalQuizzes = filteredQuizzes.length;
  const completedQuizzesList = filteredQuizzes.filter(q => q.completed_at);
  const completedQuizzes = completedQuizzesList.length;
  const quizzesWithScore = filteredQuizzes.filter(q => q.score != null);
  const sumScore = quizzesWithScore.reduce((acc, q) => acc + Number(q.score), 0);
  const averageScore = quizzesWithScore.length > 0 ? (sumScore / quizzesWithScore.length).toFixed(1) : 0;
  const totalQuizTime = filteredQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);
  const totalChatTime = filteredChatSessions.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0);

  // Evolución de Puntajes (Line Chart)
  const evolutionData = [...completedQuizzesList]
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map(q => ({
      date: new Date(q.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: Number(q.score),
      name: q.name || "Quiz"
    }));

  // Tiempo de Estudio (Stacked Bar Chart)
  const timeDataBySubject = (selectedSubjectId === "all" ? rawData.subjects : rawData.subjects.filter(s => s.id === selectedSubjectId))
    .map(sub => {
      const subQuizzes = filteredQuizzes.filter(q => q.subject_id === sub.id);
      const subChats = filteredChatSessions.filter(c => c.subject_id === sub.id);
      const quizTime = subQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);
      const chatTime = subChats.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0);
      return {
        name: sub.name,
        "Quizzes": Math.round(quizTime / 60),
        "Chat IA": Math.round(chatTime / 60)
      };
    }).filter(s => s["Quizzes"] > 0 || s["Chat IA"] > 0);

  // Dominio por materia
  const subjectStats = (selectedSubjectId === "all" ? rawData.subjects : rawData.subjects.filter(s => s.id === selectedSubjectId))
    .map(sub => {
      const subjectQuizzes = quizzesWithScore.filter(q => q.subject_id === sub.id);
      if (subjectQuizzes.length === 0) return null;
      const sum = subjectQuizzes.reduce((acc, q) => acc + Number(q.score), 0);
      return {
        name: sub.name,
        score: Math.round(sum / subjectQuizzes.length),
        fill: sub.color || "#16697A"
      };
    }).filter(Boolean).sort((a, b) => b.score - a.score);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-brand-teal" />
          <h1 className="text-3xl md:text-4xl font-black text-brand-taupe">Dashboard de Estudio</h1>
        </div>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="bg-white border border-brand-steel/20 text-brand-taupe text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal block w-full sm:w-auto p-3 shadow-sm font-bold cursor-pointer"
        >
          <option value="all">Todas las materias</option>
          {rawData.subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
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
              value={totalQuizzes}
            />
            <StatCard 
              icon={<CheckCircle className="h-6 w-6 text-brand-teal" />}
              title="Completados"
              value={completedQuizzes}
            />
            <StatCard 
              icon={<Target className="h-6 w-6 text-brand-teal" />}
              title="Puntuación Media"
              value={`${averageScore}%`}
            />
            <StatCard 
              icon={<Clock className="h-6 w-6 text-brand-teal" />}
              title="Tiempo en Quizzes"
              value={formatTime(totalQuizTime)}
            />
          </div>
        </section>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Evolución de Puntajes */}
          {evolutionData.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-brand-teal" />
                <h2 className="text-2xl font-bold text-brand-taupe">Evolución de Puntajes</h2>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#77A0A9", fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#77A0A9", fontSize: 12 }} 
                      domain={[0, 100]}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ stroke: "#16697A", strokeWidth: 1, strokeDasharray: "3 3" }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#5B4B49', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      name="Puntaje" 
                      stroke="#16697A" 
                      strokeWidth={3} 
                      dot={{ fill: "#16697A", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Tiempo de Estudio (Stacked Bar) */}
          {timeDataBySubject.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Layers className="h-6 w-6 text-brand-teal" />
                <h2 className="text-2xl font-bold text-brand-taupe">Tiempo de Estudio</h2>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeDataBySubject} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#77A0A9", fontSize: 12 }} 
                      dy={10}
                      angle={timeDataBySubject.length > 3 ? -30 : 0}
                      textAnchor={timeDataBySubject.length > 3 ? "end" : "middle"}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#77A0A9", fontSize: 12 }} 
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: "#77A0A910" }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Chat IA" stackId="a" fill="#16697A" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="Quizzes" stackId="a" fill="#DB93B0" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {/* Dominio por Materia */}
        {subjectStats.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-6 w-6 text-brand-teal" />
              <h2 className="text-2xl font-bold text-brand-taupe">Dominio por Materia</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectStats}
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
                    {subjectStats.map((entry, index) => (
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
              value={formatTime(totalChatTime)}
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
