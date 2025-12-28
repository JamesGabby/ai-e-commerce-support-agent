"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useId, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Package, 
  RotateCcw, 
  HelpCircle, 
  Truck,
  Bot,
  User,
  Snowflake,
  Mountain,
  Ruler
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);  // Add this
  const [hasLoaded, setHasLoaded] = useState(false);     // Add this
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const { messages, sendMessage, status } = useChat({
    id: uniqueId,
    generateId: () => `${uniqueId}-${Date.now()}`,
    transport: new DefaultChatTransport({
      api: "/api/chat/widget",
    }),
  });

  const isLoading = status === "streaming";

  // Scroll to top on initial load
  useEffect(() => {
    if (!hasLoaded) {
      messagesTopRef.current?.scrollIntoView({ behavior: "instant" });
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const getMessageText = (message: any): string => {
    if (message.content) return message.content;
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("");
    }
    return "";
  };

  const quickActions = [
    { label: "Track my order", icon: Package },
    { label: "Help me choose a board", icon: Ruler },
    { label: "Return or exchange", icon: RotateCcw },
    { label: "Shipping info", icon: Truck },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Ambient Background Elements - Winter Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-sky-200/40 to-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl" />
        
        {/* Floating snowflakes */}
        <div className="absolute top-20 left-10 text-cyan-200/40 animate-float" style={{ animationDelay: '0s' }}>
          <Snowflake size={24} />
        </div>
        <div className="absolute top-40 right-20 text-blue-200/40 animate-float" style={{ animationDelay: '1s' }}>
          <Snowflake size={16} />
        </div>
        <div className="absolute bottom-40 left-20 text-sky-200/40 animate-float" style={{ animationDelay: '2s' }}>
          <Snowflake size={20} />
        </div>
      </div>

      {/* Premium Header - Mountain/Snow Theme */}
      <div className="relative z-10">
        <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white px-6 py-5 shadow-xl">
          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          
          {/* Mountain silhouette decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden opacity-20">
            <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,40 L50,20 L80,30 L120,10 L160,25 L200,5 L240,20 L280,15 L320,25 L360,10 L400,30 L400,40 Z" fill="white"/>
            </svg>
          </div>

          {/* Decorative snowflakes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-10 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-6 left-24 w-1 h-1 bg-white rounded-full" />
            <div className="absolute bottom-4 right-16 w-1.5 h-1.5 bg-white rounded-full" />
            <div className="absolute top-3 right-8 w-1 h-1 bg-white rounded-full" />
            <div className="absolute top-5 left-40 w-1 h-1 bg-white rounded-full" />
          </div>

          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mountain size={20} className="text-cyan-200" />
                <h1 className="font-bold text-lg tracking-tight">
                  TechGear Snowboards
                </h1>
              </div>
              <div className="flex items-center"> 
                <span className={`inline-flex items-center gap-1.5 text-sm ${isLoading ? 'text-yellow-200' : 'text-white/80'}`}>
                  {isLoading ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
                      </span>
                      AI is typing...
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                      Online • Ready to shred 🏂
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400/50 via-blue-400/50 to-indigo-400/50" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 space-y-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
              {/* Welcome Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <span className="text-4xl">🏂</span>
                </div>
                {/* Floating particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }} />
                <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-blue-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.3s' }} />
                <div className="absolute top-1/2 -right-4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.5s' }} />
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Hey, shredder! 🤙
              </h2>
              <p className="text-slate-500 text-center max-w-xs mb-8">
                I'm here to help with orders, gear recommendations, sizing, and more. Let's get you on the mountain!
              </p>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {quickActions.map((action, index) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      sendMessage({
                        role: "user",
                        parts: [{ type: "text", text: action.label }],
                      });
                    }}
                    className="group relative p-4 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Hover gradient */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center group-hover:from-sky-200 group-hover:to-indigo-200 transition-colors">
                        <action.icon size={20} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Seasonal Banner */}
              <div className="mt-6 px-4 py-3 bg-gradient-to-r from-sky-100 to-indigo-100 rounded-xl border border-sky-200/50 w-full max-w-sm">
                <div className="flex items-center gap-2 text-sm text-sky-800">
                  <Snowflake size={16} className="text-sky-500" />
                  <span className="font-medium">Winter 2025/2026 gear is here!</span>
                </div>
                <p className="text-xs text-sky-600 mt-1">Use code WINTER25 for 25% off orders over $300</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const text = getMessageText(message);
            if (!text) return null;

            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 animate-slideIn ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 ${isUser ? 'order-1' : 'order-0'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                    isUser 
                      ? 'bg-gradient-to-br from-sky-500 to-indigo-500' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200'
                  }`}>
                    {isUser ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative max-w-[75%] ${
                    isUser ? 'order-0' : 'order-1'
                  }`}
                >
                  <div
                    className={`relative px-4 py-3 rounded-2xl shadow-sm transition-shadow hover:shadow-md ${
                      isUser
                        ? "bg-gradient-to-br from-sky-600 to-indigo-600 text-white rounded-br-md"
                        : "bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200/80 rounded-bl-md"
                    }`}
                  >
                    {/* Inner glow for user messages */}
                    {isUser && (
                      <div className="absolute inset-0 rounded-2xl rounded-br-md bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                    
                    {isUser ? (
                      <p className="relative text-sm whitespace-pre-wrap leading-relaxed">
                        {text}
                      </p>
                    ) : (
                      <div className="relative text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            a: ({ href, children }) => (
                              <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Timestamp (optional) */}
                  <span className={`absolute -bottom-5 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isUser ? 'right-0' : 'left-0'
                  }`}>
                    Just now
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-3 animate-slideIn">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shadow-md">
                <Bot size={16} className="text-blue-600" />
              </div>

              {/* Typing Bubble */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-sky-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-sky-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-sky-400 to-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Premium Input Area */}
      <div className="relative z-10 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/80">
        {/* Top gradient line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />

        <form onSubmit={handleSubmit} className="relative">
          <div className={`relative flex items-center gap-3 p-2 bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm ${
            isFocused 
              ? 'border-blue-400 shadow-lg shadow-blue-500/10' 
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            {/* Input glow effect */}
            {isFocused && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-sky-500/5 animate-pulse" />
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask about gear, orders, sizing..."
              className="relative flex-1 px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
                  : 'bg-slate-100 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              {/* Button inner glow */}
              {input.trim() && !isLoading && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
              )}
              
              <Send 
                size={18} 
                className={`relative transition-transform duration-300 ${
                  input.trim() && !isLoading 
                    ? 'text-white translate-x-0.5 -translate-y-0.5' 
                    : 'text-slate-400'
                }`} 
              />
            </button>
          </div>
        </form>

        {/* Powered by badge */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Sparkles size={12} className="text-blue-400" />
          <span className="text-[11px] text-slate-400">
            Powered by AI • Here to help you shred 🏔️
          </span>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        /* Custom scrollbar - Winter theme */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #38bdf8, #6366f1);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0ea5e9, #4f46e5);
        }
      `}</style>
    </div>
  );
}