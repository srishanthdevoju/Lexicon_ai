import React, { useRef, useEffect } from "react";
import { FileText, ZoomIn, ZoomOut, Download } from "lucide-react";
import { contractText } from "@/data/mockData";

export default function DocumentViewer() {
  const scrollRef = useRef(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-border shadow-card overflow-hidden">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[13.5px] font-semibold text-text leading-tight">
              NDA_Agreement.pdf
            </h3>
            <p className="text-[11px] text-text-muted leading-tight">
              12 Articles • 4 Pages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer">
            <ZoomOut className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <span className="text-[12px] text-text-muted px-1.5 min-w-[36px] text-center">100%</span>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer">
            <ZoomIn className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer">
            <Download className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-none prose prose-sm">
          {contractText.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-3" />;

            // Title
            if (i === 0) {
              return (
                <h2
                  key={i}
                  className="text-[15px] font-bold text-text text-center mb-4 uppercase tracking-wide"
                >
                  {trimmed}
                </h2>
              );
            }

            // Article headers
            if (trimmed.startsWith("ARTICLE") || trimmed === "RECITALS" || trimmed.startsWith("IN WITNESS") || trimmed.startsWith("BETWEEN:") || trimmed.startsWith("AND:")) {
              return (
                <h3
                  key={i}
                  className="text-[13.5px] font-bold text-text mt-5 mb-2 uppercase tracking-wide"
                >
                  {trimmed}
                </h3>
              );
            }

            // Sub-sections
            if (/^\d+\.\d+/.test(trimmed)) {
              return (
                <p key={i} className="text-[12.5px] text-text leading-[1.75] mb-2 pl-2">
                  {trimmed}
                </p>
              );
            }

            // List items
            if (/^\([a-z]\)/.test(trimmed)) {
              return (
                <p key={i} className="text-[12.5px] text-text-secondary leading-[1.75] mb-1.5 pl-6">
                  {trimmed}
                </p>
              );
            }

            // Signature lines
            if (trimmed.startsWith("___")) {
              return (
                <div key={i} className="border-t border-text-muted/30 w-60 mt-6 mb-1" />
              );
            }

            // Labels (Name:, Title:, Date:)
            if (/^(Name|Title|Date):/.test(trimmed)) {
              return (
                <p key={i} className="text-[12px] text-text-secondary mb-0.5 pl-0">
                  {trimmed}
                </p>
              );
            }

            // Default paragraph
            return (
              <p key={i} className="text-[12.5px] text-text-secondary leading-[1.75] mb-2">
                {trimmed}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
