import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";

export default function Header({ title, subtitle }) {
  return (
    <header className="h-16 bg-white border-b border-border/60 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      {/* Left */}
      <div>
        <h1 className="text-[17px] font-semibold text-text leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[12.5px] text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search documents..."
            className="h-9 w-56 pl-9 pr-4 rounded-xl bg-gray-50 border border-transparent text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-white transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ml-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-[11px] font-semibold">
            SC
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
