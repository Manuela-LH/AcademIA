import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuizResults({ score, total, onRetry, subjectId, onFinish }) {
  const percentage = Math.round((score / total) * 100);
  
  let message = "";
  let color = "";
  
  if (percentage >= 90) {
    message = "¡Excelente trabajo! Dominas el material.";
    color = "text-green-600";
  } else if (percentage >= 70) {
    message = "Muy bien, tienes una comprensión sólida del tema.";
    color = "text-brand-teal";
  } else if (percentage >= 50) {
    message = "Buen intento, pero sería útil repasar los documentos.";
    color = "text-yellow-600";
  } else {
    message = "Parece que necesitas volver a revisar el material. ¡Tú puedes!";
    color = "text-brand-pink";
  }

  return (
    <div className="bg-white rounded-[2rem] border border-brand-steel/10 shadow-lg p-8 md:p-12 text-center max-w-lg mx-auto animate-in zoom-in duration-500">
      <div className="h-24 w-24 bg-brand-blush/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trophy className={`h-12 w-12 ${color}`} />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-black text-brand-taupe mb-2">
        {score} / {total}
      </h2>
      <p className="text-xl md:text-2xl font-bold mb-6">{percentage}% Correcto</p>
      
      <p className="text-brand-steel mb-8 leading-relaxed max-w-sm mx-auto">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-teal text-brand-teal font-semibold rounded-xl hover:bg-brand-teal/5 transition-colors"
          >
            Intentar de nuevo
          </button>
        )}
        {onFinish && (
          <button 
            onClick={onFinish}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-taupe text-white font-semibold rounded-xl hover:bg-brand-taupe/90 transition-colors"
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}