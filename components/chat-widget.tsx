'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Minus, Maximize2, Zap, Circle } from 'lucide-react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const CHATBOT_URL = 'https://ai-e-commerce-support-agent.vercel.app/embed';

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      {/* Ambient Background Glow */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-[420px] h-[620px] bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-fuchsia-500/20 blur-3xl rounded-full pointer-events-none animate-pulse" />
      )}

      {/* Chat Window */}
      <div
        className={`fixed z-50 transition-all duration-500 ease-out ${
          isOpen
            ? isMinimized
              ? 'bottom-20 right-4 w-[400px] h-[64px]'
              : 'bottom-20 right-4 w-[400px] h-[600px]'
            : 'bottom-20 right-4 w-[400px] h-[600px] pointer-events-none'
        }`}
      >
        <div
          className={`relative w-full h-full transition-all duration-500 ease-out transform ${
            isOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          {/* Main Container */}
          <div className={`w-full h-full bg-white rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-200/60 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            
            {/* Premium Glassmorphism Header - Distinct Design */}
            <div className="relative h-16 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/80">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50" />
              
              {/* Animated accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-80" />
              
              {/* Content */}
              <div className="relative h-full flex items-center justify-between px-4">
                {/* Left - Brand */}
                <div className="flex items-center gap-3">
                  {/* Elegant bordered icon */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[1px]">
                      <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                        <Zap size={18} className="text-transparent bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text fill-violet-500" style={{ fill: 'url(#icon-gradient)' }} />
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <Zap size={18} className="text-violet-500 absolute" />
                      </div>
                    </div>
                    {/* Status dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  
                  <div>
                    <h3 className="text-slate-800 font-semibold text-sm tracking-tight">
                      TechGear Support
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span className="text-slate-400 text-xs">Ready to help</span>
                    </div>
                  </div>
                </div>

                {/* Right - Window Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="group p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    aria-label={isMinimized ? "Expand" : "Minimize"}
                  >
                    {isMinimized ? (
                      <Maximize2 size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                      <Minus size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="group p-2 hover:bg-rose-50 rounded-lg transition-all duration-200"
                    aria-label="Close"
                  >
                    <X size={15} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Content Area */}
            {!isMinimized && (
              <div className="relative h-[calc(100%-64px)] bg-slate-50/50">
                {/* Loading State */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white flex flex-col items-center justify-center z-10">
                    {/* Elegant loader */}
                    <div className="relative">
                      {/* Outer ring */}
                      <div className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center">
                        {/* Spinning gradient arc */}
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500 animate-spin" />
                        
                        {/* Center icon */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <Zap size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-6 text-sm text-slate-600 font-medium">Starting conversation...</p>
                    <div className="mt-3 flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}

                {/* Iframe */}
                <iframe
                  src={CHATBOT_URL}
                  className={`w-full h-full border-none transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  title="Chat Support"
                  onLoad={() => setIsLoading(false)}
                />
              </div>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div 
                className="h-[calc(100%-64px)] flex items-center justify-between px-4 cursor-pointer hover:bg-slate-50/80 transition-colors group"
                onClick={() => setIsMinimized(false)}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageCircle size={14} />
                  <span className="text-sm">Conversation paused</span>
                </div>
                <span className="text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to resume
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* Tooltip */}
        <div
          className={`absolute bottom-full right-0 mb-3 transition-all duration-300 ${
            showTooltip && !isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="relative bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap">
            <span className="font-medium">Need help?</span>
            <span className="ml-1.5 text-slate-300">Chat with us</span>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 rotate-45" />
          </div>
        </div>

        {/* Notification Badge */}
        {hasNewMessage && !isOpen && (
          <div className="absolute -top-1 -right-1 z-10">
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-rose-500 to-pink-500 items-center justify-center text-[10px] text-white font-bold shadow-md">
                1
              </span>
            </span>
          </div>
        )}

        {/* Ripple effects */}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 animate-ping opacity-20" />
            <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 animate-pulse" />
          </>
        )}

        {/* Main Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasNewMessage(false);
            setIsMinimized(false);
          }}
          onMouseEnter={() => {
            setShowTooltip(true);
            setIsHovering(true);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            setIsHovering(false);
          }}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 transform ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-700 shadow-xl'
              : 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 hover:scale-110 shadow-xl shadow-purple-500/30'
          }`}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {/* Inner highlight */}
          {!isOpen && (
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          )}

          {/* Icon */}
          <div className={`relative transition-all duration-300 ${!isOpen && isHovering ? 'scale-110' : 'scale-100'}`}>
            {isOpen ? (
              <X size={22} className="text-white" />
            ) : (
              <MessageCircle size={22} className="text-white" />
            )}
          </div>

          {/* Sparkles */}
          {!isOpen && (
            <Sparkles size={10} className="absolute top-2 right-2 text-white/60 animate-pulse" />
          )}
        </button>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  );
}