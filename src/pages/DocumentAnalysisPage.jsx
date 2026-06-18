import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { 
  getAnalysis, 
  getAnalysisText, 
  downloadReport, 
  getNotes, 
  saveNote, 
  deleteNote,
  shareDocument
} from "@/lib/api";
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
  AlertCircle,
  Columns,
  Share2,
  Trash2,
  Plus,
  X,
  CheckCircle2
} from "lucide-react";

export default function DocumentAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const [zoom, setZoom] = useState(100);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [documentText, setDocumentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notes state
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const [shareError, setShareError] = useState("");

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const notesData = await getNotes(id);
      setNotes(notesData || []);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

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
        
        // Load notes inline
        fetchNotes();
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
        setError(err.response?.data?.detail || "Failed to load analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await saveNote(id, newNote);
      setNewNote("");
      fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteNote(noteId);
      fetchNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setSharing(true);
    setShareSuccess("");
    setShareError("");
    try {
      await shareDocument(id, shareEmail);
      setShareSuccess(`Document shared with ${shareEmail}!`);
      setShareEmail("");
      setTimeout(() => setShowShareModal(false), 2000);
    } catch (err) {
      setShareError(err.response?.data?.detail || "Sharing failed.");
    } finally {
      setSharing(false);
    }
  };

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
  const totalRisks = risks?.length || 0;

  // Calculate overall risk score
  const riskScore = totalRisks > 0
    ? ((risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / (totalRisks * 3)) * 10).toFixed(1)
    : "0.0";

  return (
    <Shell>
      <div className="space-y-6">
        
        {/* Header toolbar actions */}
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border">
          <button 
            onClick={() => downloadReport(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-slate-50 rounded text-[11px] font-semibold text-text-secondary hover:text-primary transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
          
          <button 
            onClick={() => setNotesOpen(!notesOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[11px] font-semibold transition-colors shadow-xs ${
              notesOpen ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-border hover:bg-slate-50 text-text-secondary hover:text-primary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{notesOpen ? "Hide Notes" : "View Notes"}</span>
          </button>

          <button 
            onClick={() => navigate(`/split-view?docA=${id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-slate-50 rounded text-[11px] font-semibold text-text-secondary hover:text-primary transition-colors shadow-xs"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Comparison</span>
          </button>

          {userRole === "lawyer" && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-light rounded text-[11px] font-semibold text-white transition-colors shadow-xs sm:ml-auto"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share with Client</span>
            </button>
          )}
        </div>

        {/* Dynamic Multi-Pane Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Document Viewer */}
          <div className={notesOpen ? "lg:col-span-5 space-y-4" : "lg:col-span-7 space-y-4"}>
            {/* PDF Viewer Bar */}
            <div className="bg-white border border-border rounded p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-secondary shrink-0" />
                <span className="text-[12px] font-semibold text-primary uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
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
              </div>
            </div>

            {/* Document Text Display */}
            <div 
              className="bg-white border border-border rounded shadow-md p-10 min-h-[600px] relative font-serif select-text selection:bg-risk-blue/20 overflow-x-auto"
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
                <span className="truncate max-w-[200px]">Parties: {metadata?.parties?.join(", ") || "Unknown"}</span>
                <span>Effective: {metadata?.effective_date || "Unknown"}</span>
              </div>
            </div>
          </div>

          {/* Right Side: AI Analysis Panel */}
          <div className={notesOpen ? "lg:col-span-4 space-y-6" : "lg:col-span-5 space-y-6"}>
            
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
              <div className="bg-primary-50/50 p-4 border border-border rounded space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Executive Summary</h4>
                <p className="text-[12px] text-primary leading-relaxed">
                  {summary?.tldr || summary?.main_summary?.substring(0, 250) + "..." || "No summary available."}
                </p>
              </div>

              {/* KPI strip with Inconsistency Score */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-2 border border-border rounded text-center bg-white shadow-xs">
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">Clauses</span>
                  <span className="text-[13px] font-bold text-primary block mt-1">
                    {(clauses?.standard_clauses?.length || 0) + (clauses?.non_standard_clauses?.length || 0)}
                  </span>
                </div>
                <div className={`p-2 border rounded text-center shadow-xs ${
                  parseFloat(riskScore) >= 6 
                    ? "bg-risk-red-light/30 border-risk-red/15" 
                    : parseFloat(riskScore) >= 3 
                      ? "bg-risk-amber-light/30 border-risk-amber/15" 
                      : "border-border"
                }`}>
                  <span className={`text-[8px] font-bold uppercase tracking-wider block ${
                    parseFloat(riskScore) >= 6 ? "text-risk-red" : parseFloat(riskScore) >= 3 ? "text-risk-amber" : "text-text-secondary"
                  }`}>Risk</span>
                  <span className={`text-[13px] font-bold block mt-1 ${
                    parseFloat(riskScore) >= 6 ? "text-risk-red" : parseFloat(riskScore) >= 3 ? "text-risk-amber" : "text-primary"
                  }`}>{riskScore}</span>
                </div>
                <div className="p-2 border border-border rounded text-center bg-white shadow-xs">
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block font-semibold text-amber-600">Conflict</span>
                  <span className="text-[13px] font-bold text-amber-700 block mt-1">
                    {analysis.inconsistency_score !== undefined ? analysis.inconsistency_score.toFixed(1) : "0.0"}
                  </span>
                </div>
                <div className="p-2 border border-border rounded text-center bg-white shadow-xs">
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">Risks</span>
                  <span className="text-[13px] font-bold text-primary block mt-1">{String(totalRisks).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* Inconsistency details section */}
            {analysis.inconsistencies && analysis.inconsistencies.length > 0 && (
              <div className="bg-amber-50/30 border border-amber-200/50 p-5 rounded-lg space-y-3">
                <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Internal Contradictions Detected</span>
                </h4>
                <div className="space-y-2.5">
                  {analysis.inconsistencies.map((inc, idx) => (
                    <div key={idx} className="p-3 bg-white border border-border rounded shadow-xs">
                      <div className="text-[12px] font-bold text-primary flex items-center justify-between">
                        <span>{inc.title}</span>
                        <span className="text-[8px] font-bold text-amber-700 bg-amber-100/50 px-1 py-0.5 rounded">
                          {inc.severity} Severity
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{inc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Detection Cards */}
            {risks && risks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Risk Findings</h4>
                
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
                className="px-4 py-2 border border-border rounded bg-white text-text-secondary hover:text-primary transition-colors flex items-center justify-center"
                title="Open Chat Assistant"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* INLINE COLLAPSIBLE NOTES DRAWER */}
          {notesOpen && (
            <div className="lg:col-span-3 border border-border rounded bg-white p-4 flex flex-col shadow-sm space-y-4 h-[650px]">
              <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
                <h4 className="font-bold text-[13px] text-primary flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Document Notes</span>
                </h4>
                <button 
                  onClick={() => setNotesOpen(false)}
                  className="text-text-muted hover:text-primary transition-colors text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingNotes ? (
                  <div className="text-center py-8 text-[11px] text-text-secondary">Loading...</div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-text-muted italic">No notes for this contract yet. Take a note below!</div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="p-3 border border-border bg-slate-50/55 rounded shadow-xs relative group">
                      <p className="text-[12px] text-text-primary whitespace-pre-wrap leading-relaxed pr-6">{note.content}</p>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute right-2 top-2 text-text-muted hover:text-risk-red opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="border-t border-border pt-3 space-y-2 shrink-0">
                <textarea
                  placeholder="Type a new contract note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-border rounded text-[12px] bg-background focus:outline-none focus:border-primary resize-none"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="w-full py-1.5 bg-primary text-white hover:bg-primary-light text-[11px] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Share Document Overlay Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-semibold text-primary text-[14px] flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Share Legal Document</span>
              </h3>
              <button 
                onClick={() => { setShowShareModal(false); setShareError(""); setShareSuccess(""); }}
                className="text-text-muted hover:text-primary transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleShareSubmit} className="p-5 space-y-4">
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Enter your client's registered email. Once shared, the client can view this analysis in their read-only portal and coordinate messages with you.
              </p>
              
              {shareSuccess && (
                <div className="p-3 bg-risk-green-light border border-risk-green/20 rounded flex items-center gap-2 text-[12px] text-risk-green">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{shareSuccess}</span>
                </div>
              )}
              {shareError && (
                <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded flex items-center gap-2 text-[12px] text-risk-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shareError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary uppercase">
                  Client Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowShareModal(false); setShareError(""); setShareSuccess(""); }}
                  className="px-3 py-2 border border-border rounded text-[12px] text-text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !shareEmail.trim()}
                  className="px-4 py-2 bg-primary text-white rounded text-[12px] font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {sharing ? "Sharing..." : "Share Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
