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
  Zap
} from "lucide-react";

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    { label: "Return an item", icon: RotateCcw },
    { label: "Product questions", icon: HelpCircle },
    { label: "Shipping info", icon: Truck },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-200/40 to-fuchsia-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100/30 to-pink-100/30 rounded-full blur-3xl" />
      </div>

      {/* Premium Header */}
      <div className="relative z-10">
        {/* Main Header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-5 shadow-xl">
          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-10 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-6 left-20 w-1 h-1 bg-white rounded-full" />
            <div className="absolute bottom-3 right-16 w-1.5 h-1.5 bg-white rounded-full" />
            <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full" />
          </div>

          <div className="relative flex items-center gap-4">
            {/* Logo/Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <Zap size={24} className="text-white" />
              </div>
              {/* Status indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-purple-600 shadow-lg">
                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
              </span>
            </div>

            <div className="flex-1">
              <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
                TechGear Support
                <Sparkles size={16} className="text-yellow-300 animate-pulse" />
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
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
                      Online • Instant replies
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400/50 via-fuchsia-400/50 to-pink-400/50" />
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
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                  <span className="text-4xl">👋</span>
                </div>
                {/* Floating particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.1s' }} />
                <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-pink-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.3s' }} />
                <div className="absolute top-1/2 -right-4 w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.5s' }} />
              </div>

              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Welcome to TechGear!
              </h2>
              <p className="text-slate-500 text-center max-w-xs mb-8">
                I'm your AI assistant. How can I help you today?
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
                    className="group relative p-4 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl hover:border-purple-300 hover:bg-white hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Hover gradient */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center group-hover:from-violet-200 group-hover:to-fuchsia-200 transition-colors">
                        <action.icon size={20} className="text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </div>
                  </button>
                ))}
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
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200'
                  }`}>
                    {isUser ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-purple-600" />
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
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-md"
                        : "bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200/80 rounded-bl-md"
                    }`}
                  >
                    {/* Inner glow for user messages */}
                    {isUser && (
                      <div className="absolute inset-0 rounded-2xl rounded-br-md bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                    
                    <p className="relative text-sm whitespace-pre-wrap leading-relaxed">
                      {text}
                    </p>
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
                <Bot size={16} className="text-purple-600" />
              </div>

              {/* Typing Bubble */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.3s' }} />
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
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent" />

        <form onSubmit={handleSubmit} className="relative">
          <div className={`relative flex items-center gap-3 p-2 bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm ${
            isFocused 
              ? 'border-purple-400 shadow-lg shadow-purple-500/10' 
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            {/* Input glow effect */}
            {isFocused && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-violet-500/5 animate-pulse" />
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className="relative flex-1 px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 active:scale-95'
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
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[11px] text-slate-400">
            Powered by AI • Instant support 24/7
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
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a78bfa, #e879f9);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #8b5cf6, #d946ef);
        }
      `}</style>
    </div>
  );
}