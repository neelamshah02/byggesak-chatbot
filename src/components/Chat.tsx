"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MapPin, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hei! 👋 Jeg er din byggesak-assistent for Stavanger og Sandnes kommune.

Jeg kan hjelpe deg med å forstå:
- **Reguleringsplaner** for din eiendom
- **Byggeregler og krav** som gjelder for ditt område
- **Hva du kan bygge** uten å søke
- **Søknadsprosessen** for byggeprosjekter

**For å starte, skriv inn adressen din** (f.eks. "Løkkeveien 45, Stavanger"), så finner jeg informasjon om eiendommen din.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Beklager, det oppstod en feil. Vennligst prøv igjen senere.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const examples = [
    "Løkkeveien 45, Stavanger",
    "Hva kan jeg bygge uten å søke?",
    "Hvordan søker jeg om tilbygg?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="prose-chat">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Henter informasjon...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Prøv et eksempel:
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
              >
                {example.includes(",") && <MapPin className="w-3 h-3" />}
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-200 dark:border-slate-700"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv en adresse eller still et spørsmål..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
