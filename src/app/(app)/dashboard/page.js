"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, CheckCircle, Clock, Target, Hash, BarChart3, TrendingUp, Layers, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from "recharts";

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

function CalendarHeatmap({ data }) {
  if (!data || data.length === 0) return null;

  // Align to weekdays. Sunday is 0, Monday is 1, etc.
  const firstDay = data[0].date;
  const firstDayOfWeek = firstDay.getDay(); // 0-6

  // Create padded slots
  const slots = [];
  // Add empty slots for padding
  for (let i = 0; i < firstDayOfWeek; i++) {
    slots.push({ isPadding: true });
  }
  // Add actual data slots
  data.forEach(day => {
    slots.push({ ...day, isPadding: false });
  });

  // Weekday labels (S, M, T, W, T, F, S)
  const weekdays = ["D", "L", "M", "M", "J", "V", "S"];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-brand-steel/5 w-full">
      <div className="flex gap-4">
        {/* Weekday labels column */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gap: "5px"
          }}
          className="text-[10px] font-bold text-brand-steel/60 pt-2"
        >
          {weekdays.map((day, idx) => (
            <div key={idx} className="h-[12px] flex items-center justify-end pr-1 w-3">
              {idx % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gap: "5px"
          }}
        >
          {slots.map((slot, idx) => {
            if (slot.isPadding) {
              return <div key={`pad-${idx}`} className="w-[12px] h-[12px] bg-transparent" />;
            }

            // Color based on minutes studied
            let bgClass = "bg-brand-steel/10";
            if (slot.minutes > 0 && slot.minutes <= 10) bgClass = "bg-[#e6f2f4]";
            else if (slot.minutes > 10 && slot.minutes <= 30) bgClass = "bg-[#a3d1d9]";
            else if (slot.minutes > 30 && slot.minutes <= 60) bgClass = "bg-[#4899a8]";
            else if (slot.minutes > 60) bgClass = "bg-[#16697A]";

            return (
              <div
                key={idx}
                className={`w-[12px] h-[12px] rounded-[2px] transition-all hover:scale-125 hover:ring-2 hover:ring-brand-teal/40 cursor-pointer ${bgClass}`}
                title={`${slot.formattedDate}: ${slot.minutes} min de estudio`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 self-end mt-4 text-[10px] font-bold text-brand-steel/60">
        <span>Menos</span>
        <div className="w-[8px] h-[8px] rounded-[1px] bg-brand-steel/10" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#e6f2f4]" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#a3d1d9]" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#4899a8]" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-[#16697A]" />
        <span>Más</span>
      </div>
    </div>
  );
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
          .select("time_spent_seconds, subject_id, created_at")
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

  // Derived subject info
  const selectedSubject = rawData.subjects.find(s => s.id === selectedSubjectId);
  const selectedSubjectName = selectedSubject ? selectedSubject.name : "";
  const selectedSubjectColor = selectedSubject ? selectedSubject.color : "#16697A";

  // Data derivation according to the filter
  const filteredQuizzes = selectedSubjectId === "all"
    ? rawData.quizzes
    : rawData.quizzes.filter(q => q.subject_id === selectedSubjectId);

  const filteredChatSessions = selectedSubjectId === "all"
    ? rawData.chatSessions
    : rawData.chatSessions.filter(c => c.subject_id === selectedSubjectId);

  // Quizzes performance statistics
  const totalQuizzes = filteredQuizzes.length;
  const completedQuizzesList = filteredQuizzes.filter(q => q.completed_at);
  const completedQuizzes = completedQuizzesList.length;
  const quizzesWithScore = filteredQuizzes.filter(q => q.score != null);
  const sumScore = quizzesWithScore.reduce((acc, q) => acc + Number(q.score), 0);
  const averageScore = quizzesWithScore.length > 0 ? (sumScore / quizzesWithScore.length).toFixed(1) : 0;
  const totalQuizTime = filteredQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);

  // Calculate correct vs incorrect questions (Global success rate)
  let totalCorrect = 0;
  let totalIncorrect = 0;

  filteredQuizzes.forEach(q => {
    if (Array.isArray(q.user_answers) && q.user_answers.length > 0) {
      q.user_answers.forEach(ans => {
        if (ans.isCorrect) {
          totalCorrect++;
        } else {
          totalIncorrect++;
        }
      });
    } else if (q.completed_at && q.score !== null && Array.isArray(q.questions_json)) {
      const numQuestions = q.questions_json.length;
      const numCorrect = Math.round((Number(q.score) / 100) * numQuestions);
      const numIncorrect = numQuestions - numCorrect;
      totalCorrect += numCorrect;
      totalIncorrect += numIncorrect;
    }
  });

  const totalQuestionsAnswered = totalCorrect + totalIncorrect;
  const correctPct = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
  const incorrectPct = totalQuestionsAnswered > 0 ? Math.round((totalIncorrect / totalQuestionsAnswered) * 100) : 0;
  const globalSuccessRateString = totalQuestionsAnswered > 0 ? `${correctPct}% / ${incorrectPct}%` : "0% / 0%";

  // Scores Evolution (Line Chart)
  const evolutionData = [...completedQuizzesList]
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map(q => ({
      date: new Date(q.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: Number(q.score),
      name: q.name || "Quiz"
    }));

  // Comparative scores timeline (selected subject scores vs running overall average)
  const subjectQuizzes = completedQuizzesList.filter(q => q.subject_id === selectedSubjectId);
  const comparativeData = [...subjectQuizzes]
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map(q => {
      const qDate = new Date(q.completed_at);

      // Running general average of all quizzes completed on or before this date
      const quizzesBeforeOrOn = rawData.quizzes.filter(gq => {
        if (!gq.completed_at || gq.score == null) return false;
        return new Date(gq.completed_at) <= qDate;
      });
      const runningSum = quizzesBeforeOrOn.reduce((acc, gq) => acc + Number(gq.score), 0);
      const runningAvg = quizzesBeforeOrOn.length > 0 ? Math.round(runningSum / quizzesBeforeOrOn.length) : 0;

      return {
        date: qDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        subjectScore: Number(q.score),
        generalAverage: runningAvg,
        name: q.name || "Quiz"
      };
    });

  // Time distribution for Donut Chart
  const donutData = [];
  let selectedSubjectTotalStudySeconds = 0;

  if (selectedSubjectId === "all") {
    rawData.subjects.forEach(sub => {
      const subQuizzes = rawData.quizzes.filter(q => q.subject_id === sub.id);
      const subChats = rawData.chatSessions.filter(c => c.subject_id === sub.id);
      const quizTime = subQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);
      const chatTime = subChats.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0);
      const totalTimeMin = Math.round((quizTime + chatTime) / 60);
      if (totalTimeMin > 0) {
        donutData.push({
          name: sub.name,
          value: totalTimeMin,
          color: sub.color || "#16697A"
        });
      }
    });
  } else {
    // Specific subject: Quizzes vs Chat IA distribution
    const subQuizzes = rawData.quizzes.filter(q => q.subject_id === selectedSubjectId);
    const subChats = rawData.chatSessions.filter(c => c.subject_id === selectedSubjectId);
    const quizTimeSeconds = subQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);
    const chatTimeSeconds = subChats.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0);

    selectedSubjectTotalStudySeconds = quizTimeSeconds + chatTimeSeconds;

    const quizTimeMin = Math.round(quizTimeSeconds / 60);
    const chatTimeMin = Math.round(chatTimeSeconds / 60);

    if (quizTimeMin > 0) {
      donutData.push({
        name: "Quizzes",
        value: quizTimeMin,
        color: "#DB93B0"
      });
    }
    if (chatTimeMin > 0) {
      donutData.push({
        name: "Chat IA",
        value: chatTimeMin,
        color: "#16697A"
      });
    }
  }

  // Last 30 Days study activity
  const last30Days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last30Days.push(d);
  }

  const calendarData = last30Days.map(date => {
    const dateString = date.toDateString();

    const quizzesOnDay = filteredQuizzes.filter(q => {
      const qDate = new Date(q.completed_at || q.created_at);
      return qDate.toDateString() === dateString;
    });

    const chatsOnDay = filteredChatSessions.filter(c => {
      const cDate = new Date(c.created_at);
      return cDate.toDateString() === dateString;
    });

    const quizTime = quizzesOnDay.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);
    const chatTime = chatsOnDay.reduce((acc, c) => acc + (c.time_spent_seconds || 0), 0);
    const totalMinutes = Math.round((quizTime + chatTime) / 60);

    return {
      date,
      formattedDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: totalMinutes
    };
  });

  // Study Time stacked bar chart
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

  // Subject Stats for "Dominio por Materia" (Only shown for all subjects view)
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

  const colsClass = selectedSubjectId === "all"
    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";

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
          <div className={`grid ${colsClass}`}>
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
            {selectedSubjectId === "all" && (
              <StatCard
                icon={<HelpCircle className="h-6 w-6 text-brand-teal" />}
                title="Aciertos / Errores"
                value={globalSuccessRateString}
              />
            )}
          </div>
        </section>

        {/* Sección Evolución / Comparativa */}
        {selectedSubjectId === "all" ? (
          // Evolution only, full width
          evolutionData.length > 0 && (
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
          )
        ) : (
          // Side by side: Evolution (left) & Comparativa vs Promedio General (right)
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Evolución de Puntajes (Materia) */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-brand-teal" />
                <h2 className="text-2xl font-bold text-brand-taupe">Evolución de Puntajes</h2>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                {evolutionData.length > 0 ? (
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
                        stroke={selectedSubjectColor}
                        strokeWidth={3}
                        dot={{ fill: selectedSubjectColor, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-brand-steel italic text-center px-4">
                    No hay puntajes registrados para esta materia.
                  </div>
                )}
              </div>
            </section>

            {/* Right: Comparativa materia vs promedio general */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-brand-pink" />
                <h2 className="text-2xl font-bold text-brand-taupe">Comparativa vs Promedio General</h2>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                {comparativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparativeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
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
                      <Legend wrapperStyle={{ paddingTop: "10px" }} />
                      <Line
                        type="monotone"
                        dataKey="subjectScore"
                        name={`Puntaje ${selectedSubjectName}`}
                        stroke={selectedSubjectColor}
                        strokeWidth={3}
                        dot={{ fill: selectedSubjectColor, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="generalAverage"
                        name="Promedio General"
                        stroke="#77A0A9"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#77A0A9", strokeWidth: 1, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-brand-steel italic text-center px-4">
                    Completa cuestionarios de esta materia para ver la comparativa.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Sección Tiempo de Estudio */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Layers className="h-6 w-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-brand-taupe">Tiempo de Estudio</h2>
          </div>

          <div className="space-y-8">
            {/* Fila 1: Donut (izquierda) y Calendar Heatmap (derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Donut Chart */}
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[380px] flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-brand-taupe">
                    {selectedSubjectId === "all" ? "Distribución por Materia" : "Distribución de Actividades"}
                  </h3>
                  {selectedSubjectId !== "all" && (
                    <p className="text-xs text-brand-steel font-bold mt-1">
                      Estudio total: <span className="text-brand-teal">{formatTime(selectedSubjectTotalStudySeconds)}</span>
                    </p>
                  )}
                </div>
                <div className="flex-1 min-h-0 relative">
                  {donutData.length > 0 ? (
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} min`, "Tiempo"]}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Central label inside donut for total minutes in specific subject */}
                      {selectedSubjectId !== "all" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: "-10%" }}>
                          <span className="text-2xl font-black text-brand-taupe">
                            {Math.round(selectedSubjectTotalStudySeconds / 60)}
                          </span>
                          <span className="text-[10px] font-bold text-brand-steel uppercase tracking-wider">min total</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-brand-steel italic text-center px-4">
                      No hay registros de tiempo en esta vista.
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Heatmap */}
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[380px] flex flex-col">
                <h3 className="text-lg font-bold text-brand-taupe mb-1">Actividad (Últimos 30 días)</h3>
                <p className="text-xs text-brand-steel mb-4">Días que estudiaste y nivel de actividad diaria en minutos.</p>
                <div className="flex-1 flex items-center justify-center">
                  <CalendarHeatmap data={calendarData} />
                </div>
              </div>
            </div>

            {/* Fila 2: Gráfica de Barras Apiladas */}
            {timeDataBySubject.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                <h3 className="text-lg font-bold text-brand-taupe mb-4">Tiempo de Estudio Acumulado por Materia (minutos)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeDataBySubject} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
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
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="Chat IA" stackId="a" fill="#16697A" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="Quizzes" stackId="a" fill="#DB93B0" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Dominio por Materia - Solo para Todas las Materias */}
        {selectedSubjectId === "all" && subjectStats.length > 0 && (
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
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
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
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-brand-steel/10 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-full bg-brand-blush/20 flex items-center justify-center mb-4 text-brand-teal">
        {icon}
      </div>
      <p className="text-sm font-bold text-brand-steel mb-1">{title}</p>
      <p className="text-3xl font-black text-brand-taupe">{value}</p>
    </div>
  );
}
