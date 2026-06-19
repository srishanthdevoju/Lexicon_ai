import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { getAnalysis, getAnalysisText } from "@/lib/api";
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Search, 
  Sparkles, 
  MessageSquare,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function DocumentAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [documentText, setDocumentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [analysisData, textData] = await Promise.all([
          getAnalysis(id),
          getAnalysisText(id).catch(() => ""),
        ]);
        setAnalysis(analysisData);
        setDocumentText(textData || "");
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
        setError(err.response?.data?.detail || "Failed to load analysis. Please try again.");
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
            <span className="text-[13px] text-text-secondary">Loading analysis...</span>
          </div>
        </div>
      </Shell>
    );
  }

  if (error || !analysis) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <AlertCircle className="w-8 h-8 text-risk-red" />
            <h3 className="font-semibold text-[15px] text-primary">Analysis Not Found</h3>
            <p className="text-[13px] text-text-secondary">{error || "This analysis session could not be loaded."}</p>
            <button
              onClick={() => navigate("/upload")}
              className="mt-2 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
            >
              Upload New Document
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const { summary, risks, clauses, metadata } = analysis;
  const highRisks = risks?.filter(r => r.severity?.toLowerCase() === "high" || r.is_critical) || [];
  const medRisks = risks?.filter(r => r.severity?.toLowerCase() === "medium") || [];
  const lowRisks = risks?.filter(r => r.severity?.toLowerCase() === "low") || [];
  const totalRisks = risks?.length || 0;

  // Calculate overall risk score
  const riskScore = totalRisks > 0
    ? ((risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / (totalRisks * 3)) * 10).toFixed(1)
    : "0.0";

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Document Viewer (3/5 columns) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* PDF Viewer Bar */}
          <div className="bg-white border border-border rounded p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-secondary" />
              <span className="text-[12px] font-semibold text-primary uppercase tracking-tight">
                {metadata?.document_type || "Legal Document"}
              </span>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-4 text-text-secondary">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setZoom(prev => Math.max(75, prev - 10))}
                  className="p-1 hover:bg-primary-50 rounded transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold w-10 text-center">{zoom}%</span>
                <button 
                  onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                  className="p-1 hover:bg-primary-50 rounded transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <button className="p-1 hover:bg-primary-50 rounded transition-colors" title="Search Document">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:bg-primary-50 rounded transition-colors" title="Download">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Text Display */}
          <div 
            className="bg-white border border-border rounded shadow-md p-10 min-h-[700px] relative font-serif select-text selection:bg-risk-blue/20"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease-out" }}
          >
            <div className="flex justify-between items-center text-[10px] text-text-muted font-sans border-b border-border/40 pb-3 mb-6 font-semibold uppercase tracking-wider">
              <span>Lexicon AI Document Workspace</span>
              <span>{metadata?.document_type || "Document"}</span>
            </div>

            {/* Document Text Content */}
            <div className="space-y-4 text-[13px] leading-[1.8] text-primary whitespace-pre-line text-justify">
              {documentText ? (
                <p>{documentText}</p>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p className="text-[13px]">Document text preview is not available.</p>
                  <p className="text-[11px] mt-1">View the analysis summary on the right panel.</p>
                </div>
              )}
            </div>

            {/* Page Footer */}
            <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[10px] text-text-muted font-sans border-t border-border/40 pt-3">
              <span>Parties: {metadata?.parties?.join(", ") || "Unknown"}</span>
              <span>Effective: {metadata?.effective_date || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Right Side: AI Analysis Panel (2/5 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Analysis Title */}
          <div className="bg-white border border-border rounded p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-[15px] text-primary">AI Analysis</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-risk-blue font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-green"></span>
                <span>Completed</span>
              </span>
            </div>

            {/* Executive Summary */}
            <div className="bg-primary-50 p-4 border border-border rounded space-y-2">
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Executive Summary</h4>
              <p className="text-[12px] text-primary leading-relaxed">
                {summary?.tldr || summary?.main_summary?.substring(0, 200) + "..." || "No summary available."}
              </p>
            </div>

            {/* Key Points */}
            {summary?.key_points?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Key Points</h4>
                <ul className="space-y-1">
                  {summary.key_points.slice(0, 5).map((point, idx) => (
                    <li key={idx} className="text-[11px] text-text-secondary flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-border rounded text-center">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Clauses</span>
                <span className="text-md font-bold text-primary block mt-1">
                  {(clauses?.standard_clauses?.length || 0) + (clauses?.non_standard_clauses?.length || 0)}
                </span>
              </div>
              <div className={`p-3 border rounded text-center ${
                parseFloat(riskScore) >= 6 
                  ? "bg-risk-red-light/30 border-risk-red/15" 
                  : parseFloat(riskScore) >= 3 
                    ? "bg-risk-amber-light/30 border-risk-amber/15" 
                    : "border-border"
              }`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                  parseFloat(riskScore) >= 6 ? "text-risk-red" : parseFloat(riskScore) >= 3 ? "text-risk-amber" : "text-text-secondary"
                }`}>Risk Score</span>
                <span className={`text-md font-bold block mt-1 ${
                  parseFloat(riskScore) >= 6 ? "text-risk-red" : parseFloat(riskScore) >= 3 ? "text-risk-amber" : "text-primary"
                }`}>{riskScore}<span className="text-[10px] text-text-secondary font-medium">/10</span></span>
              </div>
              <div className="p-3 border border-border rounded text-center">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Risks</span>
                <span className="text-md font-bold text-primary block mt-1">{String(totalRisks).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          {/* Risk Detection Cards */}
          {risks && risks.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Risk Detection</h4>
              
              {risks.slice(0, 4).map((risk, idx) => {
                const isHigh = risk.severity?.toLowerCase() === "high" || risk.is_critical;
                const isMed = risk.severity?.toLowerCase() === "medium";
                const colorClass = isHigh ? "risk-red" : isMed ? "risk-amber" : "risk-green";
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveHighlight(risk.title)}
                    className={`p-4 border rounded shadow-xs cursor-pointer transition-all duration-300 ${
                      activeHighlight === risk.title
                        ? `bg-${colorClass}-light border-${colorClass} shadow-sm`
                        : `bg-white border-border hover:border-${colorClass}/40`
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-[13px] text-primary">{risk.title}</h5>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold bg-${colorClass}-light text-${colorClass} rounded border border-${colorClass}/10 uppercase tracking-wider`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      {risk.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Navigation Row */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/clauses/${id}`)}
              className="flex-1 py-2 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Extracted Clauses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate(`/chat/${id}`)}
              className="px-4 py-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors"
              title="Open Chat Assistant"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </Shell>
  );
}
