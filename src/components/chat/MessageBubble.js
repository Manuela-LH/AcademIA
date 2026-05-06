import { Brain, User } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`flex max-w-[85%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          isUser ? "bg-brand-teal text-white" : "bg-brand-pink/20 text-brand-pink"
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
        </div>

        {/* Bubble */}
        <div className={`px-5 py-4 rounded-2xl ${
          isUser 
            ? "bg-brand-teal text-white rounded-tr-none" 
            : "bg-white border border-brand-steel/20 text-brand-taupe rounded-tl-none shadow-sm"
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
