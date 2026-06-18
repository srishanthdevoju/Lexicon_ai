import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { getAnalysis } from "@/lib/api";
import { 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Lock, 
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export default function ClauseExtractionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getAnalysis(id);
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
        setError(err.response?.data?.detail || "Failed to load clause data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <span className="text-[13px] text-text-secondary">Loading clauses...</span>
          </div>
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-risk-red" />
            <p className="text-[13px] text-text-secondary">{error || "Could not load clause data."}</p>
            <button onClick={() => navigate(`/analysis/${id}`)} className="mt-2 px-4 py-2 bg-primary text-white text-[13px] rounded">
              Back to Analysis
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const { clauses } = analysis;
  const standardClauses = clauses?.standard_clauses || [];
  const nonStandardClauses = clauses?.non_standard_clauses || [];

  // Group clauses into display categories
  const categories = [];

  if (standardClauses.length > 0) {
    categories.push({
      name: "Standard Clauses",
      icon: Lock,
      clauses: standardClauses.map(cl => ({
        title: cl.title,
        type: "Standard",
        badgeStyle: "bg-primary-100 text-text-secondary border-border",
        excerpt: cl.content,
        audit: `This clause is classified as a standard provision typically found in ${analysis.metadata?.document_type || "legal agreements"}.`
      }))
    });
  }

  if (nonStandardClauses.length > 0) {
    categories.push({
      name: "Non-Standard Clauses (Flagged)",
      icon: ShieldAlert,
      clauses: nonStandardClauses.map(cl => ({
        title: cl.title,
        type: "Non-Standard",
        badgeStyle: "bg-risk-red-light text-risk-red border-risk-red/10",
        excerpt: cl.content,
        audit: "This clause is classified as non-standard — it may contain unusual, highly restrictive, or asymmetric terms that warrant additional legal review."
      }))
    });
  }

  if (categories.length === 0) {
    categories.push({
      name: "No Clauses Found",
      icon: Lock,
      clauses: [{
        title: "No clauses were extracted",
        type: "N/A",
        badgeStyle: "bg-primary-100 text-text-secondary border-border",
        excerpt: "The AI analysis did not extract any specific clauses from this document.",
        audit: "Try re-uploading the document or using a different format."
      }]
    });
  }

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header and Back Link */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Clause Analysis</h1>
            <p className="text-[13px] text-text-secondary">
              {standardClauses.length + nonStandardClauses.length} clauses extracted and classified by Lexicon AI.
            </p>
          </div>
        </div>

        {/* Clause Extraction Accordion */}
        <div className="space-y-4">
          {categories.map((cat, catIdx) => {
            const Icon = cat.icon;
            const isExpanded = expandedIndex === catIdx;
            
            return (
              <div key={catIdx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedIndex(isExpanded ? null : catIdx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-[14px] text-primary">{cat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-text-secondary">
                    <span className="text-[11px] font-medium">{cat.clauses.length} clauses</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border bg-primary-50/15">
                    {cat.clauses.map((clause, clIdx) => (
                      <div key={clIdx} className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-semibold text-[13px] text-primary">{clause.title}</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border shrink-0 ${clause.badgeStyle}`}>
                            {clause.type}
                          </span>
                        </div>

                        {/* Contract text excerpt */}
                        <div className="p-4 border-l-2 border-primary bg-primary-50/30 font-serif text-[12px] leading-relaxed text-primary rounded-r">
                          <span className="font-sans font-bold text-[9px] text-text-secondary uppercase tracking-wider block mb-1">
                            Contract Text Extract
                          </span>
                          "{clause.excerpt}"
                        </div>

                        {/* AI Audit explanation */}
                        <div className="text-[12px] text-text-secondary space-y-1">
                          <span className="text-[9px] font-bold text-risk-blue uppercase tracking-wider block">
                            AI Audit Assessment
                          </span>
                          <p className="leading-relaxed">{clause.audit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </Shell>
  );
}
