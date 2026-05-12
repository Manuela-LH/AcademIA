import { Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[90%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? "bg-brand-teal text-white" : "bg-brand-pink/20 text-brand-pink"
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
        </div>

        {/* Bubble */}
        <div className={`px-5 py-4 rounded-2xl ${
          isUser 
            ? "bg-brand-teal text-white rounded-tr-none shadow-md" 
            : "bg-white border border-brand-steel/20 text-brand-taupe rounded-tl-none shadow-sm"
        }`}>
          <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-p:my-0 break-words">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-black text-inherit" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
