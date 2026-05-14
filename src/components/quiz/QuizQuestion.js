import { CheckCircle, XCircle } from "lucide-react";

export default function QuizQuestion({ data, index, onAnswer, disabled, userAnswer, showResults }) {
  const isRevealed = showResults || userAnswer !== null;

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