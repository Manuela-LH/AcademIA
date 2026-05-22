"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings2, Loader2, Sparkles } from "lucide-react";
import MessageBubble from "./MessageBubble";
import useActiveTimer from "@/hooks/useActiveTimer";

// Constantes basadas en CLAUDE.md
const TECHNIQUES = [
  { id: "neutral", name: "Explicación Estándar" },
  { id: "socratic", name: "Método Socrático" },
  { id: "feynman", name: "Técnica de Feynman" },
  { id: "breakdown", name: "Desglose Paso a Paso" },
  { id: "spaced", name: "Práctica Espaciada" }
];

export default function ChatWindow({ subjectId, hasApiKey, technique, setTechnique, onRequestApiKey }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola! Soy tu tutor IA para esta materia. He analizado los documentos que subiste. ¿En qué tema quieres profundizar hoy o qué dudas tienes?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const { getTotalSeconds, setInitialElapsed, startInterval } = useActiveTimer({
    showDisplay: false,
    autoStart: false
  });

  useEffect(() => {
    let mounted = true;
    async function initSession() {
      try {
        const res = await fetch("/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId })
        });
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          setSessionId(data.sessionId);
          if (data.time_spent_seconds > 0) {
            setInitialElapsed(data.time_spent_seconds * 1000);
          }
        }
      } catch (err) {
        console.error("Error initializing chat session:", err);
      }
    }
    initSession();
    return () => { mounted = false; };
  }, [subjectId, setInitialElapsed]);

  useEffect(() => {
    if (!sessionId || !hasStarted) return;
    const interval = setInterval(() => {
      fetch("/api/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, timeSpentSeconds: getTotalSeconds() })
      }).catch(err => console.error("Periodic session save error:", err));
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId, hasStarted, getTotalSeconds]);

  useEffect(() => {
    if (!sessionId || !hasStarted) return;
    const handleBeforeUnload = () => {
      fetch("/api/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ sessionId, timeSpentSeconds: getTotalSeconds() })
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId, hasStarted, getTotalSeconds]);

  useEffect(() => {
    if (!sessionId || !hasStarted) return;
    return () => {
      fetch("/api/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ sessionId, timeSpentSeconds: getTotalSeconds() })
      }).catch(err => console.error("Unmount session save error:", err));
    };
  }, [sessionId, hasStarted, getTotalSeconds]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    if (!hasApiKey) {
      if (onRequestApiKey) onRequestApiKey();
      return;
    }

    if (!hasStarted) {
      startInterval();
      setHasStarted(true);
    }

    const userMsg = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          subjectId,
          studyTechnique: technique,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al comunicarse con la IA");
      }

      // Procesar el stream en tiempo real
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "Ocurrió un error: " + error.message }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
      if (sessionId) {
        fetch("/api/chat/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, timeSpentSeconds: getTotalSeconds() })
        }).catch(err => console.error("Save on message error:", err));
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-brand-steel/20 shadow-sm overflow-hidden flex-1">
      {/* Chat Header / Toolbar */}
      <div className="bg-brand-blush/10 border-b border-brand-steel/20 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-brand-teal">
          <Sparkles className="h-5 w-5" />
          <span className="font-bold">Sesión de Estudio</span>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Settings2 className="h-4 w-4 text-brand-steel hidden sm:block" />
          <select 
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            className="w-full sm:w-auto text-sm border border-brand-steel/30 rounded-lg px-3 py-2 bg-white text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            {TECHNIQUES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-brand-blush/5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex w-full justify-start mb-6">
            <div className="flex gap-4">
              <div className="shrink-0 h-10 w-10 rounded-full bg-brand-pink/20 text-brand-pink flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white border border-brand-steel/20 text-brand-steel rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-brand-steel/20 bg-white">
        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Haz una pregunta sobre el material..."
              className="w-full border border-brand-steel/30 rounded-xl px-4 py-3 bg-white text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none min-h-[56px] max-h-32"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-brand-teal hover:bg-[#0e4f5c] text-white p-3 md:px-6 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-brand-teal flex items-center justify-center h-[56px]"
          >
            <Send className="h-5 w-5" />
            <span className="hidden md:inline ml-2 font-semibold">Enviar</span>
          </button>
        </form>
        <p className="text-center text-xs text-brand-steel mt-3">
          Las respuestas de la IA pueden no ser perfectas. Siempre verifica la información con tus documentos.
        </p>
      </div>
    </div>
  );
}
