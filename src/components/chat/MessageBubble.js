import { Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-black text-inherit" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                // ── Table support ──
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-brand-steel/20 shadow-sm">
                    <table className="w-full text-sm border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className={isUser ? "bg-white/20" : "bg-brand-blush/15"} {...props} />
                ),
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => (
                  <tr className={`border-b border-brand-steel/10 last:border-0 ${
                    isUser ? "even:bg-white/10" : "even:bg-brand-blush/5"
                  }`} {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className={`px-4 py-2.5 text-left font-bold text-xs uppercase tracking-wider ${
                      isUser ? "text-white/90" : "text-brand-teal"
                    }`}
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-4 py-2.5 leading-snug" {...props} />
                ),
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
