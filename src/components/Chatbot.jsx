import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { chatMessages as initialMessages, mockChatResponses } from "@/data/mockData";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response =
        mockChatResponses[responseIndex % mockChatResponses.length];
      setResponseIndex((prev) => prev + 1);

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMsg]);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl gradient-bg text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 z-50 cursor-pointer animate-bounce-in"
      >
        <MessageSquare className="w-6 h-6" strokeWidth={1.8} />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 h-12 pl-4 pr-5 rounded-2xl gradient-bg text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all cursor-pointer"
        >
          <Bot className="w-5 h-5" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">Legal Assistant</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[540px] bg-white rounded-2xl shadow-xl border border-border/80 flex flex-col z-50 animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="gradient-bg px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[13.5px] font-semibold text-white">
              AI Legal Assistant
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" />
              <span className="text-[11px] text-white/80">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            } animate-fade-in`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-primary-50"
                  : "bg-gradient-to-br from-primary to-primary-dark"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              ) : (
                <User className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              )}
            </div>
            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === "assistant"
                  ? "bg-white border border-border/60 rounded-tl-md"
                  : "gradient-bg text-white rounded-tr-md"
              }`}
            >
              <p
                className={`text-[12.5px] leading-relaxed ${
                  msg.role === "assistant" ? "text-text-secondary" : "text-white"
                }`}
              >
                {msg.content}
              </p>
              <p
                className={`text-[10px] mt-1.5 ${
                  msg.role === "assistant" ? "text-text-muted" : "text-white/60"
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            </div>
            <div className="bg-white border border-border/60 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/40 typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary/40 typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary/40 typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/60 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            className="flex-1 h-10 px-4 rounded-xl bg-gray-50 border border-transparent text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-white transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl gradient-bg text-white flex items-center justify-center hover:shadow-md hover:shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
