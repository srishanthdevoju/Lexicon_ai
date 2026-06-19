import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { 
  getAnalysisText, 
  getAnalysis, 
  listAnalyses, 
  compareDocuments 
} from "@/lib/api";
import { 
  FileText, 
  Columns, 
  ArrowLeftRight, 
  Check, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Search,
  BookOpen,
  Scale,
  Sparkles,
  AlertTriangle
} from "lucide-react";

export default function SplitViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Doc selection
  const [documents, setDocuments] = useState([]);
  const [docAId, setDocAId] = useState(searchParams.get("docA") || "");
  const [docBId, setDocBId] = useState(searchParams.get("docB") || "");
  const [docCId, setDocCId] = useState("");
  
  // Loading & Content
  const [loadingList, setLoadingList] = useState(true);
  const [docAText, setDocAText] = useState("");
  const [docBText, setDocBText] = useState("");
  const [docCText, setDocCText] = useState("");
  const [docAAnalysis, setDocAAnalysis] = useState(null);
  const [docBAnalysis, setDocBAnalysis] = useState(null);
  const [docCAnalysis, setDocCAnalysis] = useState(null);
  
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [loadingC, setLoadingC] = useState(false);
  
  // Right Pane Mode: 'document' (compare side-by-side) vs 'analysis' (compare doc A text vs its analysis)
  const [rightMode, setRightMode] = useState("document");
  
  // Layout and interaction states
  const [leftWidth, setLeftWidth] = useState(50); // percentage width for left panel (only if 2 docs compared)
  const [syncScroll, setSyncScroll] = useState(false);
  const [searchQueryA, setSearchQueryA] = useState("");
  const [searchQueryB, setSearchQueryB] = useState("");
  const [searchQueryC, setSearchQueryC] = useState("");
  
  // Cross-doc contradictions state
  const [crossContradictions, setCrossContradictions] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Pane refs for scroll syncing
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const thirdPaneRef = useRef(null);
  const scrollLockRef = useRef(false);

  // Resize divider ref
  const containerRef = useRef(null);

  // Fetch list of available documents
  useEffect(() => {
    async function loadList() {
      setLoadingList(true);
      try {
        const data = await listAnalyses();
        setDocuments(data.analyses || []);
        
        // Auto-select if empty and lists are loaded
        if (data.analyses && data.analyses.length > 0) {
          if (!docAId) setDocAId(data.analyses[0].document_id);
          if (!docBId && data.analyses.length > 1) setDocBId(data.analyses[1].document_id);
        }
      } catch (err) {
        console.error("Failed to fetch documents list:", err);
      } finally {
        setLoadingList(false);
      }
    }
    loadList();
  }, []);

  // Load Doc A Content
  useEffect(() => {
    if (!docAId) return;
    async function loadA() {
      setLoadingA(true);
      try {
        const text = await getAnalysisText(docAId);
        const analysis = await getAnalysis(docAId);
        setDocAText(text);
        setDocAAnalysis(analysis);
      } catch (err) {
        console.error("Error loading Doc A:", err);
      } finally {
        setLoadingA(false);
      }
    }
    loadA();
  }, [docAId]);

  // Load Doc B Content
  useEffect(() => {
    if (!docBId) {
      setDocBText("");
      setDocBAnalysis(null);
      return;
    }
    async function loadB() {
      setLoadingB(true);
      try {
        const text = await getAnalysisText(docBId);
        const analysis = await getAnalysis(docBId);
        setDocBText(text);
        setDocBAnalysis(analysis);
      } catch (err) {
        console.error("Error loading Doc B:", err);
      } finally {
        setLoadingB(false);
      }
    }
    loadB();
  }, [docBId]);

  // Load Doc C Content
  useEffect(() => {
    if (!docCId) {
      setDocCText("");
      setDocCAnalysis(null);
      return;
    }
    async function loadC() {
      setLoadingC(true);
      try {
        const text = await getAnalysisText(docCId);
        const analysis = await getAnalysis(docCId);
        setDocCText(text);
        setDocCAnalysis(analysis);
      } catch (err) {
        console.error("Error loading Doc C:", err);
      } finally {
        setLoadingC(false);
      }
    }
    loadC();
  }, [docCId]);

  // Run cross-document comparison using our API if multiple documents are selected
  const handleRunComparison = async () => {
    if (!docAId || (!docBId && !docCId)) return;
    setLoadingComparison(true);
    setCrossContradictions(null);
    try {
      const docIds = [docAId];
      if (docBId) docIds.push(docBId);
      if (docCId) docIds.push(docCId);
      
      const data = await compareDocuments(docIds);
      setCrossContradictions(data);
    } catch (err) {
      console.error("Comparison failed:", err);
      alert("Failed to compare documents. Verify backend services are active.");
    } finally {
      setLoadingComparison(false);
    }
  };

  // Synchronized Scrolling Logic
  const handleScroll = (source) => {
    if (!syncScroll || scrollLockRef.current) return;
    
    scrollLockRef.current = true;
    
    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;
    const thirdPane = thirdPaneRef.current;
    
    if (!leftPane) {
      scrollLockRef.current = false;
      return;
    }

    let percentage = 0;
    if (source === "left") {
      percentage = leftPane.scrollTop / (leftPane.scrollHeight - leftPane.clientHeight);
    } else if (source === "right" && rightPane) {
      percentage = rightPane.scrollTop / (rightPane.scrollHeight - rightPane.clientHeight);
    } else if (source === "third" && thirdPane) {
      percentage = thirdPane.scrollTop / (thirdPane.scrollHeight - thirdPane.clientHeight);
    }

    if (source !== "left") {
      leftPane.scrollTop = percentage * (leftPane.scrollHeight - leftPane.clientHeight);
    }
    if (source !== "right" && rightPane) {
      rightPane.scrollTop = percentage * (rightPane.scrollHeight - rightPane.clientHeight);
    }
    if (source !== "third" && thirdPane) {
      thirdPane.scrollTop = percentage * (thirdPane.scrollHeight - thirdPane.clientHeight);
    }

    // Release lock on next frame
    requestAnimationFrame(() => {
      scrollLockRef.current = false;
    });
  };

  // Resizable Divider Logic (Only when 2 documents compared)
  const startResize = (e) => {
    e.preventDefault();
    const onMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Helper to highlight matching queries in text
  const renderHighlightedText = (text, query) => {
    if (!text) return "";
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-amber-200 text-black px-0.5 rounded">{part}</mark>
        : part
    );
  };

  const getDocName = (docId) => {
    const doc = documents.find(d => d.document_id === docId);
    return doc ? doc.filename : "Select contract...";
  };

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
        
        {/* Split View Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-border rounded-lg shadow-sm gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Document A Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Doc A:</span>
              <select 
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                className="bg-transparent text-[12px] font-medium text-primary focus:outline-none max-w-[160px]"
              >
                {documents.map(d => (
                  <option key={d.document_id} value={d.document_id}>{d.filename}</option>
                ))}
              </select>
            </div>

            {/* Document B Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Doc B:</span>
              <select 
                value={docBId}
                onChange={(e) => {
                  setDocBId(e.target.value);
                  if (e.target.value === docCId) setDocCId("");
                }}
                disabled={rightMode === "analysis"}
                className="bg-transparent text-[12px] font-medium text-primary focus:outline-none max-w-[160px] disabled:opacity-50"
              >
                <option value="">(None)</option>
                {documents.filter(d => d.document_id !== docAId).map(d => (
                  <option key={d.document_id} value={d.document_id}>{d.filename}</option>
                ))}
              </select>
            </div>

            {/* Document C Selector */}
            {rightMode === "document" && (
              <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded animate-in fade-in duration-200">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">Doc C:</span>
                <select 
                  value={docCId}
                  onChange={(e) => setDocCId(e.target.value)}
                  className="bg-transparent text-[12px] font-medium text-primary focus:outline-none max-w-[160px]"
                >
                  <option value="">(None)</option>
                  {documents.filter(d => d.document_id !== docAId && d.document_id !== docBId).map(d => (
                    <option key={d.document_id} value={d.document_id}>{d.filename}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sync Scroll Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text-secondary hover:text-primary transition-colors pl-2">
              <input 
                type="checkbox" 
                checked={syncScroll} 
                onChange={() => setSyncScroll(!syncScroll)}
                className="rounded border-border focus:ring-primary text-primary"
              />
              <span>Synchronize Scroll</span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Right Pane Mode selector */}
            <div className="flex border border-border rounded overflow-hidden">
              <button 
                onClick={() => setRightMode("document")}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                  rightMode === "document" ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button 
                onClick={() => {
                  setRightMode("analysis");
                  setDocCId(""); // Doc C not supported in Doc vs Analysis mode
                }}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                  rightMode === "analysis" ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Doc vs Analysis</span>
              </button>
            </div>

            {/* Cross-doc Comparison button */}
            {rightMode === "document" && docAId && (docBId || docCId) && (
              <button
                onClick={handleRunComparison}
                disabled={loadingComparison}
                className="px-3 py-1.5 bg-primary text-white hover:bg-primary-light text-[11px] font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingComparison ? "Comparing..." : "Cross-Compare Docs"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Pane Split Viewer Container */}
        <div ref={containerRef} className="flex-1 flex border border-border bg-white rounded-lg overflow-hidden shadow-sm relative min-h-0">
          
          {/* LEFT PANE - Document A Content */}
          <div 
            style={!docCId ? { width: `${leftWidth}%` } : {}}
            className={`flex flex-col h-full min-w-0 ${docCId ? "flex-1" : ""}`}
          >
            {/* Pane A Header */}
            <div className="p-3 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[12px] font-bold text-primary truncate">
                  {getDocName(docAId)}
                </span>
              </div>
              <div className="relative w-40 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Find text..."
                  value={searchQueryA}
                  onChange={(e) => setSearchQueryA(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 border border-border rounded text-[11px] bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Pane A Text Box */}
            <div 
              ref={leftPaneRef}
              onScroll={() => handleScroll("left")}
              className="flex-1 overflow-y-auto p-6 text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap font-mono select-text"
            >
              {loadingA ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : (
                renderHighlightedText(docAText, searchQueryA) || (
                  <p className="text-text-muted text-center italic mt-12">No document text loaded.</p>
                )
              )}
            </div>
          </div>

          {/* RESIZABLE DIVIDER DRAGGER (Only shown if docCId is empty) */}
          {!docCId && (
            <div 
              onMouseDown={startResize}
              className="w-1.5 hover:w-2 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center shrink-0 transition-all group z-20 relative"
            >
              <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-400 group-hover:bg-white rounded-full"></div>
            </div>
          )}

          {/* RIGHT PANE - Document B Content OR Document A Analysis */}
          <div 
            style={!docCId ? { width: `${100 - leftWidth}%` } : {}}
            className={`flex flex-col h-full min-w-0 ${docCId ? "flex-1 border-l border-border" : ""}`}
          >
            {rightMode === "document" ? (
              // Document vs Document Mode
              <>
                {/* Pane B Header */}
                <div className="p-3 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[12px] font-bold text-primary truncate">
                      {docBId ? getDocName(docBId) : "Select Contract B"}
                    </span>
                  </div>
                  {docBId && (
                    <div className="relative w-40 shrink-0">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Find text..."
                        value={searchQueryB}
                        onChange={(e) => setSearchQueryB(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 border border-border rounded text-[11px] bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Pane B Text Box */}
                <div 
                  ref={rightPaneRef}
                  onScroll={() => handleScroll("right")}
                  className="flex-1 overflow-y-auto p-6 text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap font-mono select-text"
                >
                  {loadingB ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : !docBId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-secondary gap-3">
                      <Columns className="w-8 h-8 text-primary/30" />
                      <div>
                        <p className="font-semibold text-[13px] text-primary">Compare Side-by-Side</p>
                        <p className="text-[11px] mt-1">Select Document B in the dropdown above to load and compare texts side-by-side.</p>
                      </div>
                    </div>
                  ) : (
                    renderHighlightedText(docBText, searchQueryB) || (
                      <p className="text-text-muted text-center italic mt-12">No document text loaded.</p>
                    )
                  )}
                </div>
              </>
            ) : (
              // Document vs Analysis Mode
              <>
                <div className="p-3 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-[12px] font-bold text-primary">Analysis Dashboard (Doc A)</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loadingA ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : !docAAnalysis ? (
                    <p className="text-text-secondary text-center italic mt-12 text-[12px]">Load Doc A to see analysis.</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Card */}
                      <div className="border border-border rounded p-4 bg-primary-50/20">
                        <h4 className="text-[12px] font-bold text-primary uppercase mb-2">Executive Summary</h4>
                        <p className="text-[13px] leading-relaxed text-text-primary">
                          {docAAnalysis.summary?.main_summary}
                        </p>
                      </div>

                      {/* Risks Counter Card */}
                      <div className="border border-border rounded p-4">
                        <h4 className="text-[12px] font-bold text-primary uppercase mb-3">Flagged Risks</h4>
                        {docAAnalysis.risks && docAAnalysis.risks.length > 0 ? (
                          <div className="space-y-2.5">
                            {docAAnalysis.risks.map((risk, idx) => (
                              <div key={idx} className="flex flex-col p-3 border border-border bg-slate-50/50 rounded gap-1">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    risk.severity === "High" ? "text-risk-red" : risk.severity === "Medium" ? "text-risk-amber" : "text-primary"
                                  }`} />
                                  <span className="text-[12px] font-bold text-primary">{risk.title}</span>
                                  <span className={`ml-auto text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                                    risk.severity === "High" ? "bg-risk-red-light text-risk-red" : risk.severity === "Medium" ? "bg-risk-amber-light text-risk-amber" : "bg-slate-100 text-text-secondary"
                                  }`}>
                                    {risk.severity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{risk.description}</p>
                                {risk.mitigation && (
                                  <div className="mt-2 text-[10.5px] border-t border-dashed border-border pt-1.5 text-primary">
                                    <span className="font-semibold text-[10px] uppercase text-risk-green">Mitigation:</span> {risk.mitigation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-text-secondary italic">No specific risk flags detected.</p>
                        )}
                      </div>

                      {/* Inconsistency Score Card */}
                      <div className="border border-border rounded p-4 bg-background">
                        <h4 className="text-[12px] font-bold text-primary uppercase mb-3 flex items-center justify-between">
                          <span>Internal Inconsistencies</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-primary-100 text-primary font-semibold">
                            Risk: {docAAnalysis.inconsistency_score ?? "0.0"}/10
                          </span>
                        </h4>
                        {docAAnalysis.inconsistencies && docAAnalysis.inconsistencies.length > 0 ? (
                          <div className="space-y-2">
                            {docAAnalysis.inconsistencies.map((inc, idx) => (
                              <div key={idx} className="p-2.5 border border-border rounded bg-white">
                                <div className="text-[12px] font-bold text-primary">{inc.title}</div>
                                <p className="text-[11px] text-text-secondary mt-1">{inc.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-text-secondary italic">No internal contradictions found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* THIRD PANE - Document C Content (Side-by-side mode only, when docCId is selected) */}
          {rightMode === "document" && docCId && (
            <div className="flex-1 flex flex-col h-full min-w-0 border-l border-border animate-in slide-in-from-right duration-300">
              {/* Pane C Header */}
              <div className="p-3 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] font-bold text-primary truncate">
                    {getDocName(docCId)}
                  </span>
                </div>
                <div className="relative w-40 shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Find text..."
                    value={searchQueryC}
                    onChange={(e) => setSearchQueryC(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 border border-border rounded text-[11px] bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Pane C Text Box */}
              <div 
                ref={thirdPaneRef}
                onScroll={() => handleScroll("third")}
                className="flex-1 overflow-y-auto p-6 text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap font-mono select-text"
              >
                {loadingC ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : (
                  renderHighlightedText(docCText, searchQueryC) || (
                    <p className="text-text-muted text-center italic mt-12">No document text loaded.</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel - Cross Document Contradiction Analysis */}
        {rightMode === "document" && (crossContradictions || loadingComparison) && (
          <div className="bg-slate-50 border border-border rounded-lg p-5 shrink-0 shadow-sm max-h-60 overflow-y-auto">
            <h3 className="font-bold text-[13px] text-primary flex items-center gap-1.5 mb-3 border-b border-border pb-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>Cross-Document Inconsistency Report</span>
              {crossContradictions && (
                <span className="ml-auto text-[11px] px-2 py-0.5 bg-risk-amber-light text-risk-amber border border-risk-amber/20 rounded font-semibold">
                  Conflict Index: {crossContradictions.inconsistency_score}/10
                </span>
              )}
            </h3>

            {loadingComparison ? (
              <div className="flex items-center gap-2 py-4 justify-center text-[12px] text-text-secondary">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span>Running deep comparison agent...</span>
              </div>
            ) : crossContradictions?.inconsistencies && crossContradictions.inconsistencies.length > 0 ? (
              <div className="space-y-3">
                {crossContradictions.inconsistencies.map((inc, idx) => (
                  <div key={idx} className="bg-white border border-border p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[12px] text-primary">{inc.title}</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        inc.severity === "High" ? "bg-risk-red-light text-risk-red border border-risk-red/20" : "bg-risk-amber-light text-risk-amber border border-risk-amber/20"
                      }`}>
                        {inc.severity} Severity
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      {inc.description}
                    </p>
                    {inc.affected_sections && inc.affected_sections.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Sections:</span>
                        {inc.affected_sections.map((sec, sIdx) => (
                          <span key={sIdx} className="text-[9px] font-semibold text-primary bg-primary-100/50 px-1.5 py-0.5 rounded">
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-secondary italic text-center py-4">No cross-document inconsistencies detected. The documents appear mutually consistent.</p>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
