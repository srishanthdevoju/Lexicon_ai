import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  ListCollapse,
  ListTree,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockAnalysisResult } from "@/data/mockData";

const typeVariantMap = {
  Standard: "standard",
  "Key Term": "keyterm",
  Critical: "critical",
};

export default function ClausesSection() {
  const clauses = mockAnalysisResult.data.clauses;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [expandedClauses, setExpandedClauses] = useState(new Set([0, 2]));
  const [showFilter, setShowFilter] = useState(false);

  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      const matchesSearch =
        clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "All" || clause.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clauses, searchQuery, filterType]);

  const toggleClause = (index) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedClauses(new Set(filteredClauses.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  const types = ["All", "Standard", "Key Term", "Critical"];

  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <ListTree className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[14.5px] font-semibold text-text">
                Clauses ({filteredClauses.length})
              </h3>
              <p className="text-[11.5px] text-text-muted">Identified provisions</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={expandAll}
              className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-text-secondary hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Expand All"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Expand</span>
            </button>
            <button
              onClick={collapseAll}
              className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-text-secondary hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Collapse All"
            >
              <ListCollapse className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Collapse</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clauses..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-gray-50 border border-transparent text-[12.5px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-white transition-all"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="h-8 px-3 rounded-lg bg-gray-50 text-[12.5px] text-text-secondary hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" strokeWidth={2} />
              {filterType !== "All" ? filterType : "Filter"}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-border shadow-lg z-10 py-1 animate-scale-in">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      setShowFilter(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 transition-colors cursor-pointer ${
                      filterType === type
                        ? "text-primary font-medium bg-primary-50/50"
                        : "text-text-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clauses List */}
      <div className="max-h-[520px] overflow-y-auto">
        <div className="p-3 space-y-2">
          {filteredClauses.map((clause, index) => {
            const isExpanded = expandedClauses.has(index);
            return (
              <div
                key={index}
                className="rounded-xl border border-border/60 hover:border-border transition-colors overflow-hidden"
              >
                <button
                  onClick={() => toggleClause(index)}
                  className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        clause.type === "Critical"
                          ? "bg-red-500"
                          : clause.type === "Key Term"
                          ? "bg-primary"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-[13px] font-medium text-text truncate">
                      {clause.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant={typeVariantMap[clause.type]}>{clause.type}</Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-3.5 animate-fade-in">
                    <p className="text-[12.5px] text-text-secondary leading-relaxed pl-[18px]">
                      {clause.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
