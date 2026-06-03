"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2, LayoutDashboard, CheckCircle, Clock, Target, Hash,
  BarChart3, TrendingUp, Layers, HelpCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from "recharts";

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  if (seconds < 60) return "< 1 min";
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// ── Calendar Heatmap – proper month calendar with navigation ──────────────────
function CalendarHeatmap({ quizzes, chatSessions }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonthIdx, setViewMonthIdx] = useState(currentMonth);

  const canGoNext =
    viewYear < currentYear ||
    (viewYear === currentYear && viewMonthIdx < currentMonth);

  const goToPrev = () => {
    if (viewMonthIdx === 0) { setViewYear(y => y - 1); setViewMonthIdx(11); }
    else setViewMonthIdx(m => m - 1);
  };

  const goToNext = () => {
    if (!canGoNext) return;
    if (viewMonthIdx === 11) { setViewYear(y => y + 1); setViewMonthIdx(0); }
    else setViewMonthIdx(m => m + 1);
  };

  // Compute minutes per day for the visible month
  const minutesByDay = useMemo(() => {
    const map = {};
    quizzes.forEach(q => {
      const d = new Date(q.completed_at || q.created_at);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonthIdx) {
        const k = d.getDate();
        map[k] = (map[k] || 0) + Math.round((q.time_spent_seconds || 0) / 60);
      }
    });
    chatSessions.forEach(c => {
      const d = new Date(c.created_at);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonthIdx) {
        const k = d.getDate();
        map[k] = (map[k] || 0) + Math.round((c.time_spent_seconds || 0) / 60);
      }
    });
    return map;
  }, [quizzes, chatSessions, viewYear, viewMonthIdx]);

  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  const firstDayRaw = new Date(viewYear, viewMonthIdx, 1).getDay(); // 0=Sun
  const firstDayMon = (firstDayRaw + 6) % 7; // 0=Mon
  const todayStr = now.toDateString();

  // Build grid: null = padding cell, otherwise { day, minutes, isToday, isFuture }
  const grid = [];
  for (let i = 0; i < firstDayMon; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonthIdx, d);
    grid.push({
      day: d,
      minutes: minutesByDay[d] || 0,
      isToday: date.toDateString() === todayStr,
      isFuture: date > now,
    });
  }
  while (grid.length % 7 !== 0) grid.push(null);

  const rawLabel = new Date(viewYear, viewMonthIdx, 1)
    .toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

  const cellBg = (minutes, isFuture) => {
    if (isFuture) return "bg-transparent";
    if (minutes === 0) return "bg-brand-steel/10";
    if (minutes <= 10) return "bg-[#e6f2f4]";
    if (minutes <= 30) return "bg-[#a3d1d9]";
    if (minutes <= 60) return "bg-[#4899a8]";
    return "bg-[#16697A]";
  };

  const cellText = (minutes, isFuture) => {
    if (isFuture) return "text-brand-steel/20";
    if (minutes > 30) return "text-white";
    return "text-brand-taupe/70";
  };

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className="p-1.5 hover:bg-brand-blush/20 rounded-lg transition-colors text-brand-steel hover:text-brand-taupe"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-brand-taupe">{monthLabel}</span>
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className="p-1.5 hover:bg-brand-blush/20 rounded-lg transition-colors text-brand-steel hover:text-brand-taupe disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-[3px] mb-1">
        {weekdays.map((d, i) => (
          <div key={i} className="w-8 h-5 flex items-center justify-center text-[10px] font-bold text-brand-steel/60">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {grid.map((cell, idx) => {
          if (!cell) return <div key={`pad-${idx}`} className="w-8 h-8" />;
          return (
            <div
              key={idx}
              className={[
                "w-8 h-8 flex items-center justify-center rounded-md",
                "text-[11px] font-semibold transition-transform hover:scale-110 cursor-default",
                cellBg(cell.minutes, cell.isFuture),
                cellText(cell.minutes, cell.isFuture),
                cell.isToday ? "ring-2 ring-brand-teal" : "",
              ].join(" ")}
              title={cell.isFuture ? "" : `${cell.day} – ${cell.minutes} min de estudio`}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end mt-3 text-[10px] font-bold text-brand-steel/60">
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [rawData, setRawData] = useState({ subjects: [], quizzes: [], chatSessions: [] });
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [chartWeekOffset, setChartWeekOffset] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  // Reset week when subject filter changes
  useEffect(() => {
    setChartWeekOffset(0);
  }, [selectedSubjectId]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push("/login"); return; }

        const { data: quizzes, error: quizzesError } = await supabase
          .from("quizzes").select("*").eq("user_id", user.id);
        if (quizzesError) throw quizzesError;

        const { data: subjects, error: subjectsError } = await supabase
          .from("subjects").select("id, name, color").eq("user_id", user.id);
        if (subjectsError) throw subjectsError;

        const { data: chatSessions, error: chatError } = await supabase
          .from("chat_sessions")
          .select("time_spent_seconds, subject_id, created_at")
          .eq("user_id", user.id);
        if (chatError) throw chatError;

        setRawData({ subjects: subjects || [], quizzes: quizzes || [], chatSessions: chatSessions || [] });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Error al cargar las estadísticas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [router, supabase]);

  // ── Derived selections ────────────────────────────────────────────────────
  const selectedSubject = rawData.subjects.find(s => s.id === selectedSubjectId);
  const selectedSubjectName = selectedSubject ? selectedSubject.name : "";
  const selectedSubjectColor = selectedSubject ? selectedSubject.color : "#16697A";

  const filteredQuizzes = selectedSubjectId === "all"
    ? rawData.quizzes
    : rawData.quizzes.filter(q => q.subject_id === selectedSubjectId);

  const filteredChatSessions = selectedSubjectId === "all"
    ? rawData.chatSessions
    : rawData.chatSessions.filter(c => c.subject_id === selectedSubjectId);

  // ── Quiz stats ────────────────────────────────────────────────────────────
  const totalQuizzes = filteredQuizzes.length;
  const completedQuizzesList = filteredQuizzes.filter(q => q.completed_at);
  const completedQuizzes = completedQuizzesList.length;
  const quizzesWithScore = filteredQuizzes.filter(q => q.score != null);
  const sumScore = quizzesWithScore.reduce((acc, q) => acc + Number(q.score), 0);
  const averageScore = quizzesWithScore.length > 0 ? (sumScore / quizzesWithScore.length).toFixed(1) : 0;
  const totalQuizTime = filteredQuizzes.reduce((acc, q) => acc + (q.time_spent_seconds || 0), 0);

  let totalCorrect = 0;
  let totalIncorrect = 0;
  filteredQuizzes.forEach(q => {
    if (Array.isArray(q.user_answers) && q.user_answers.length > 0) {
      q.user_answers.forEach(ans => {
        if (ans.isCorrect) totalCorrect++; else totalIncorrect++;
      });
    } else if (q.completed_at && q.score !== null && Array.isArray(q.questions_json)) {
      const n = q.questions_json.length;
      const c = Math.round((Number(q.score) / 100) * n);
      totalCorrect += c; totalIncorrect += n - c;
    }
  });
  const totalQA = totalCorrect + totalIncorrect;
  const correctPct = totalQA > 0 ? Math.round((totalCorrect / totalQA) * 100) : 0;
  const incorrectPct = totalQA > 0 ? Math.round((totalIncorrect / totalQA) * 100) : 0;
  const globalSuccessRateString = totalQA > 0 ? `${correctPct}% / ${incorrectPct}%` : "0% / 0%";

  // ── Week navigation ───────────────────────────────────────────────────────
  const weekBounds = useMemo(() => {
    const n = new Date();
    const daysFromMonday = (n.getDay() + 6) % 7;
    const monday = new Date(n);
    monday.setDate(n.getDate() - daysFromMonday + chartWeekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  }, [chartWeekOffset]);

  const weekLabel = useMemo(() => {
    const { monday, sunday } = weekBounds;
    const start = monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const end = sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    return `${start} – ${end}`;
  }, [weekBounds]);

  // ── Week-filtered evolution data ──────────────────────────────────────────
  const weekEvolutionData = completedQuizzesList
    .filter(q => {
      const d = new Date(q.completed_at);
      return d >= weekBounds.monday && d <= weekBounds.sunday;
    })
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map(q => ({
      date: new Date(q.completed_at).toLocaleDateString("es-ES", {
        weekday: "short", day: "numeric", month: "numeric"
      }),
      score: Number(q.score),
      name: q.name || "Quiz",
    }));

  // ── Week-filtered comparative data (specific subject view) ────────────────
  const weekComparativeData = completedQuizzesList
    .filter(q => {
      const d = new Date(q.completed_at);
      return d >= weekBounds.monday && d <= weekBounds.sunday;
    })
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map(q => {
      const qDate = new Date(q.completed_at);
      const prior = rawData.quizzes.filter(gq =>
        gq.completed_at && gq.score != null && new Date(gq.completed_at) <= qDate
      );
      const runningAvg = prior.length > 0
        ? Math.round(prior.reduce((a, gq) => a + Number(gq.score), 0) / prior.length)
        : 0;
      return {
        date: qDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "numeric" }),
        subjectScore: Number(q.score),
        generalAverage: runningAvg,
        name: q.name || "Quiz",
      };
    });

  // ── Donut data ────────────────────────────────────────────────────────────
  const donutData = [];
  let selectedSubjectTotalStudySeconds = 0;

  if (selectedSubjectId === "all") {
    rawData.subjects.forEach(sub => {
      const sq = rawData.quizzes.filter(q => q.subject_id === sub.id);
      const sc = rawData.chatSessions.filter(c => c.subject_id === sub.id);
      const totalMin = Math.round(
        (sq.reduce((a, q) => a + (q.time_spent_seconds || 0), 0) +
          sc.reduce((a, c) => a + (c.time_spent_seconds || 0), 0)) / 60
      );
      if (totalMin > 0) donutData.push({ name: sub.name, value: totalMin, color: sub.color || "#16697A" });
    });
  } else {
    const sq = rawData.quizzes.filter(q => q.subject_id === selectedSubjectId);
    const sc = rawData.chatSessions.filter(c => c.subject_id === selectedSubjectId);
    const quizSec = sq.reduce((a, q) => a + (q.time_spent_seconds || 0), 0);
    const chatSec = sc.reduce((a, c) => a + (c.time_spent_seconds || 0), 0);
    selectedSubjectTotalStudySeconds = quizSec + chatSec;
    const qMin = Math.round(quizSec / 60);
    const cMin = Math.round(chatSec / 60);
    if (qMin > 0) donutData.push({ name: "Quizzes", value: qMin, color: "#DB93B0" });
    if (cMin > 0) donutData.push({ name: "Chat IA", value: cMin, color: "#16697A" });
  }

  const donutTotalMinutes = donutData.reduce((acc, d) => acc + d.value, 0);

  // ── Stacked bar data (only for "all subjects") ────────────────────────────
  const timeDataBySubject = (
    selectedSubjectId === "all"
      ? rawData.subjects
      : rawData.subjects.filter(s => s.id === selectedSubjectId)
  ).map(sub => {
    const sq = filteredQuizzes.filter(q => q.subject_id === sub.id);
    const sc = filteredChatSessions.filter(c => c.subject_id === sub.id);
    return {
      name: sub.name,
      "Quizzes": Math.round(sq.reduce((a, q) => a + (q.time_spent_seconds || 0), 0) / 60),
      "Chat IA": Math.round(sc.reduce((a, c) => a + (c.time_spent_seconds || 0), 0) / 60),
    };
  }).filter(s => s["Quizzes"] > 0 || s["Chat IA"] > 0);

  // ── Subject mastery data ──────────────────────────────────────────────────
  const subjectStats = (
    selectedSubjectId === "all"
      ? rawData.subjects
      : rawData.subjects.filter(s => s.id === selectedSubjectId)
  ).map(sub => {
    const subQ = quizzesWithScore.filter(q => q.subject_id === sub.id);
    if (subQ.length === 0) return null;
    const avg = Math.round(subQ.reduce((a, q) => a + Number(q.score), 0) / subQ.length);
    return { name: sub.name, score: avg, fill: sub.color || "#16697A" };
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

  // Shared week-navigation UI
  const weekNavUI = (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => setChartWeekOffset(p => p - 1)}
        className="p-1.5 hover:bg-brand-blush/20 rounded-lg transition-colors text-brand-steel hover:text-brand-taupe"
        title="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-center min-w-[170px]">
        <p className="text-sm font-semibold text-brand-taupe whitespace-nowrap">{weekLabel}</p>
        {chartWeekOffset === 0 && (
          <p className="text-[10px] text-brand-teal font-bold">Semana actual</p>
        )}
      </div>
      <button
        onClick={() => setChartWeekOffset(p => p + 1)}
        disabled={chartWeekOffset >= 0}
        className="p-1.5 hover:bg-brand-blush/20 rounded-lg transition-colors text-brand-steel hover:text-brand-taupe disabled:opacity-30 disabled:cursor-not-allowed"
        title="Semana siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  const emptyWeekMsg = (
    <div className="flex items-center justify-center h-full text-brand-steel italic text-center px-4">
      No hay cuestionarios completados en esta semana.
    </div>
  );

  const chartTooltipStyle = {
    contentStyle: { borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
    labelStyle: { fontWeight: "bold", color: "#5B4B49", marginBottom: "4px" },
    cursor: { stroke: "#16697A", strokeWidth: 1, strokeDasharray: "3 3" },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-brand-teal" />
          <h1 className="text-3xl md:text-4xl font-black text-brand-taupe">Dashboard de Estudio</h1>
        </div>
        <select
          value={selectedSubjectId}
          onChange={e => setSelectedSubjectId(e.target.value)}
          className="bg-white border border-brand-steel/20 text-brand-taupe text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal block w-full sm:w-auto p-3 shadow-sm font-bold cursor-pointer"
        >
          <option value="all">Todas las materias</option>
          {rawData.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-12">

        {/* ── Quiz performance ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-6 w-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-brand-taupe">Rendimiento en Quizzes</h2>
          </div>
          <div className={`grid ${colsClass}`}>
            <StatCard icon={<Hash className="h-6 w-6 text-brand-teal" />} title="Total Creados" value={totalQuizzes} />
            <StatCard icon={<CheckCircle className="h-6 w-6 text-brand-teal" />} title="Completados" value={completedQuizzes} />
            <StatCard icon={<Target className="h-6 w-6 text-brand-teal" />} title="Puntuación Media" value={`${averageScore}%`} />
            <StatCard icon={<Clock className="h-6 w-6 text-brand-teal" />} title="Tiempo en Quizzes" value={formatTime(totalQuizTime)} />
            {selectedSubjectId === "all" && (
              <StatCard icon={<HelpCircle className="h-6 w-6 text-brand-teal" />} title="Aciertos / Errores" value={globalSuccessRateString} />
            )}
          </div>
        </section>

        {/* ── Evolution / Comparative charts – week navigation ── */}
        {selectedSubjectId === "all" ? (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-brand-teal" />
                <h2 className="text-2xl font-bold text-brand-taupe">Evolución de Puntajes</h2>
              </div>
              {weekNavUI}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
              {weekEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekEvolutionData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 12 }} domain={[0, 100]} dx={-10} />
                    <Tooltip cursor={chartTooltipStyle.cursor} contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} />
                    <Line type="monotone" dataKey="score" name="Puntaje" stroke="#16697A" strokeWidth={3} dot={{ fill: "#16697A", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : emptyWeekMsg}
            </div>
          </section>
        ) : (
          /* Specific subject: evolution + comparative side by side */
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-brand-teal" />
                <h2 className="text-2xl font-bold text-brand-taupe">Puntajes por Semana</h2>
              </div>
              {weekNavUI}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Evolución */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-brand-teal" />
                  <h3 className="text-lg font-bold text-brand-taupe">Evolución de Puntajes</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                  {weekEvolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weekEvolutionData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 12 }} domain={[0, 100]} dx={-10} />
                        <Tooltip cursor={chartTooltipStyle.cursor} contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} />
                        <Line type="monotone" dataKey="score" name="Puntaje" stroke={selectedSubjectColor} strokeWidth={3} dot={{ fill: selectedSubjectColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : emptyWeekMsg}
                </div>
              </div>

              {/* Comparativa */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-brand-pink" />
                  <h3 className="text-lg font-bold text-brand-taupe">Comparativa vs Promedio General</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                  {weekComparativeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weekComparativeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#77A0A920" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 12 }} domain={[0, 100]} dx={-10} />
                        <Tooltip cursor={chartTooltipStyle.cursor} contentStyle={chartTooltipStyle.contentStyle} labelStyle={chartTooltipStyle.labelStyle} />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Line type="monotone" dataKey="subjectScore" name={`Puntaje ${selectedSubjectName}`} stroke={selectedSubjectColor} strokeWidth={3} dot={{ fill: selectedSubjectColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#DB93B0", stroke: "#fff" }} />
                        <Line type="monotone" dataKey="generalAverage" name="Promedio General" stroke="#77A0A9" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#77A0A9", strokeWidth: 1, r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : emptyWeekMsg}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Study time section ── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Layers className="h-6 w-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-brand-taupe">Tiempo de Estudio</h2>
          </div>

          <div className="space-y-8">
            {/* Row 1: Donut + Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Donut Chart */}
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-brand-taupe mb-4">
                  {selectedSubjectId === "all" ? "Distribución por Materia" : "Distribución de Actividades"}
                </h3>
                {donutData.length > 0 ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Pie with perfectly centred overlay */}
                    <div className="relative flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={v => [`${v} min`, "Tiempo"]}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centred total – overlaid directly on the SVG canvas (cy=50%) */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-brand-taupe">{donutTotalMinutes}</span>
                        <span className="text-[10px] font-bold text-brand-steel uppercase tracking-wider">min total</span>
                      </div>
                    </div>
                    {/* Custom legend row */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 shrink-0">
                      {donutData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-brand-steel font-medium">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-brand-steel italic text-center px-4">
                    No hay registros de tiempo en esta vista.
                  </div>
                )}
              </div>

              {/* Calendar Heatmap */}
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-brand-taupe mb-1">Actividad por Mes</h3>
                <p className="text-xs text-brand-steel mb-4">Minutos de estudio por día. Navega entre meses anteriores.</p>
                <div className="flex-1 flex items-start justify-center">
                  <CalendarHeatmap
                    quizzes={filteredQuizzes}
                    chatSessions={filteredChatSessions}
                  />
                </div>
              </div>

            </div>

            {/* Row 2: Stacked bar – ONLY for "all subjects" view */}
            {selectedSubjectId === "all" && timeDataBySubject.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
                <h3 className="text-lg font-bold text-brand-taupe mb-4">
                  Tiempo de Estudio Acumulado por Materia (minutos)
                </h3>
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
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 12 }} dx={-10} />
                    <Tooltip cursor={{ fill: "#77A0A910" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="Chat IA" stackId="a" fill="#16697A" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="Quizzes" stackId="a" fill="#DB93B0" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ── Dominio por Materia – only for "all subjects" view ── */}
        {selectedSubjectId === "all" && subjectStats.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-6 w-6 text-brand-teal" />
              <h2 className="text-2xl font-bold text-brand-taupe">Dominio por Materia</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brand-steel/10 shadow-sm h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#77A0A9", fontSize: 12 }} domain={[0, 100]} dx={-10} />
                  <Tooltip cursor={{ fill: "#77A0A910" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {subjectStats.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
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
