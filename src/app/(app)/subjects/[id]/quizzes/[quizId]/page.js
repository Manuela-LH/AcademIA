"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import useActiveTimer from "@/hooks/useActiveTimer";

export default function QuizPlayPage({ params }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  const quizId = resolvedParams.quizId;
  const router = useRouter();
  const supabase = createClient();
  const { displayTime, getTotalSeconds, setInitialElapsed } = useActiveTimer();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz?subjectId=${subjectId}`);
        if (res.ok) {
          const data = await res.json();
          const foundQuiz = data.find(q => q.id === quizId);
          if (foundQuiz) {
            setQuiz(foundQuiz);
            setQuestions(foundQuiz.questions_json || []);
            setUserAnswers(foundQuiz.user_answers || []);
            setCurrentScore(foundQuiz.score || 0);
            setAnswersCount(foundQuiz.user_answers?.length || 0);
            if (foundQuiz.time_spent_seconds > 0) {
              setInitialElapsed(foundQuiz.time_spent_seconds * 1000);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, subjectId]);

  const handleAnswer = async (questionIndex, selectedOption, correctOption) => {
    if (userAnswers.some(a => a.questionIndex === questionIndex)) return;

    const isCorrect = selectedOption === correctOption;
    
    if (isCorrect) {
      setCurrentScore(prev => prev + 1);
    }

    const newAnswers = [...userAnswers, {
      questionIndex,
      selectedOption,
      isCorrect
    }];
    setUserAnswers(newAnswers);

    const newAnswersCount = newAnswers.length;
    setAnswersCount(newAnswersCount);

    const correctAnswers = newAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);

    setIsSavingAnswer(true);
    try {
      await fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          userAnswers: newAnswers,
          score: percentage,
          isFinished: false,
          timeSpentSeconds: getTotalSeconds()
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleManualFinish = async () => {
    setIsSaving(true);
    try {
      const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
      const percentage = Math.round((correctAnswers / questions.length) * 100);

      await fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          userAnswers,
          score: percentage,
          isFinished: true,
          timeSpentSeconds: getTotalSeconds()
        })
      });
      router.push(`/subjects/${subjectId}/quizzes`);
    } catch (e) {
      console.error(e);
      toast.error("Error al finalizar el cuestionario");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-teal mb-4" />
        <p className="text-brand-steel">Cargando cuestionario...</p>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <p className="text-brand-steel mb-4">Cuestionario no encontrado</p>
        <Link 
          href={`/subjects/${subjectId}/quizzes`}
          className="text-brand-teal font-bold hover:underline"
        >
          Volver a cuestionarios
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-10">
      <div className="flex-1 flex flex-col">
        {questions.length > 0 && (
          <>
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-brand-steel/10 shadow-sm sticky top-0 z-10 mb-6">
              <Link 
                href={`/subjects/${subjectId}/quizzes`}
                className="p-2 bg-white border border-brand-steel/10 rounded-lg text-brand-taupe hover:text-brand-teal transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-black text-brand-taupe truncate">{quiz.name}</h1>
                <span className="font-bold text-brand-steel text-xs md:text-sm">
                  Progreso: {answersCount} / {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-teal/10 text-brand-teal px-2.5 py-1.5 rounded-full font-bold text-xs md:text-sm shadow-sm shrink-0 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{displayTime}</span>
              </div>
            </div>

            <div className="space-y-6 pb-6">
              {questions.map((q, idx) => (
                <QuizQuestionItem 
                  key={idx} 
                  index={idx} 
                  data={q} 
                  onAnswer={(selected, correct) => handleAnswer(idx, selected, correct)}
                  disabled={false}
                  userAnswer={userAnswers.find(a => a.questionIndex === idx)?.selectedOption}
                />
              ))}
            </div>

            <div className="flex justify-end pb-12">
              <button
                onClick={handleManualFinish}
                disabled={answersCount < questions.length || isSaving}
                className="flex items-center justify-center px-8 py-4 bg-brand-teal text-white font-bold rounded-2xl hover:bg-[#0e4f5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-teal/20"
              >
                {isSaving ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Guardando...</>
                ) : (
                  "Finalizar Cuestionario"
                )}
              </button>
            </div>
          </>
        )}

        {isSaving && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-teal mx-auto mb-2" />
              <p className="text-brand-steel">Guardando resultados...</p>
            </div>
          </div>
        )}

        {isSavingAnswer && (
          <div className="fixed bottom-5 right-5 bg-brand-taupe/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 border border-white/10 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Loader2 className="h-4 w-4 animate-spin text-brand-teal" />
            <span className="text-sm font-bold tracking-wide">Guardando respuesta...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizQuestionItem({ data, index, onAnswer, disabled, userAnswer }) {
  const isRevealed = userAnswer !== undefined;

  const handleSelect = (optionIdx) => {
    if (disabled || isRevealed) return;
    onAnswer(optionIdx, data.correct);
  };

  const getOptionStyle = (idx) => {
    if (!isRevealed) {
      return "border-brand-steel/30 bg-white hover:bg-brand-blush/10 text-brand-taupe cursor-pointer";
    }
    if (idx === data.correct) {
      return "border-green-500 bg-green-50 text-green-800 cursor-default font-medium";
    }
    if (idx === userAnswer && idx !== data.correct) {
      return "border-red-400 bg-red-50 text-red-800 cursor-default";
    }
    return "border-brand-steel/20 bg-gray-50 text-brand-steel/60 cursor-default";
  };

  const getIcon = (idx) => {
    if (!isRevealed) return null;
    if (idx === data.correct) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (idx === userAnswer && idx !== data.correct) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-steel/10 shadow-sm p-6 md:p-8">
      <h3 className="text-lg md:text-xl font-bold text-brand-taupe mb-6">
        <span className="text-brand-teal mr-2">{index + 1}.</span>
        {data.question}
      </h3>

      <div className="space-y-3">
        {data.options.map((option, idx) => (
          <div 
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`w-full text-left px-4 py-3 md:py-4 rounded-xl border-2 transition-all flex justify-between items-center ${getOptionStyle(idx)}`}
          >
            <span className="text-sm md:text-base">{option}</span>
            {getIcon(idx) && <span>{getIcon(idx)}</span>}
          </div>
        ))}
      </div>

      {isRevealed && data.explanation && (
        <div className="mt-6 p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
          <p className="text-sm font-semibold text-brand-teal mb-1">Explicación:</p>
          <p className="text-sm text-brand-taupe leading-relaxed">
            {data.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
