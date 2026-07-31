import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { useTranslation } from "@/lib/LanguageContext";
import { listAnalyses, getAnalysis, negotiateChat } from "@/lib/api";
import {
  Bot,
  User,
  Send,
  RefreshCw,
  Sparkles,
  Award,
  AlertCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  Settings,
  Scale
} from "lucide-react";

export default function NegotiationSandbox() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedDocAnalysis, setSelectedDocAnalysis] = useState(null);
  
  // Clause configuration
  const [clauses, setClauses] = useState([]);
  const [selectedClauseTitle, setSelectedClauseTitle] = useState("");
  const [clauseText, setClauseText] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("Apex Corp");
  const [personality, setPersonality] = useState("Collaborative");

  // Chat conversation
  const [negotiationActive, setNegotiationActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Negotiation status states
  const [agreementPct, setAgreementPct] = useState(0);
  const [counterProposal, setCounterProposal] = useState("");
  const [contentionPoints, setContentionPoints] = useState([]);

  // UI status
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      setLoadingDocs(true);
      try {
        const data = await listAnalyses();
        const docs = data.analyses || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0].document_id);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setLoadingDocs(false);
      }
    }
    loadDocs();
  }, []);

  useEffect(() => {
    if (!selectedDocId) return;
    async function loadAnalysis() {
      setLoadingAnalysis(true);
      try {
        const data = await getAnalysis(selectedDocId);
        setSelectedDocAnalysis(data);
        
        // Compile a list of clauses from analysis
        const extractedClauses = [];
        if (data.clauses?.standard_clauses) {
          extractedClauses.push(...data.clauses.standard_clauses);
        }
        if (data.clauses?.non_standard_clauses) {
          extractedClauses.push(...data.clauses.non_standard_clauses);
        }
        
        setClauses(extractedClauses);
        if (extractedClauses.length > 0) {
          setSelectedClauseTitle(extractedClauses[0].title);
          setClauseText(extractedClauses[0].content);
        } else {
          setSelectedClauseTitle("Indemnification");
          setClauseText("Each party agrees to indemnify, defend, and hold harmless the other party from...");
        }
      } catch (err) {
        console.error("Failed to load analysis details:", err);
      } finally {
        setLoadingAnalysis(false);
      }
    }
    loadAnalysis();
  }, [selectedDocId]);

  const handleClauseChange = (title) => {
    setSelectedClauseTitle(title);
    const clause = clauses.find(c => c.title === title);
    if (clause) {
      setClauseText(clause.content);
    }
  };

  const handleStartNegotiation = () => {
    setNegotiationActive(true);
    setAgreementPct(15); // Start with baseline agreement
    setCounterProposal("");
    setContentionPoints(["Need mutually balanced terms", "Assess liability caps"]);
    setMessages([
      {
        role: "assistant",
        content: `Hello, this is counsel for ${counterpartyName}. We have reviewed the drafted '${selectedClauseTitle}' clause. Frankly, we have some reservations about this wording and want to reach a compromise. How do you propose we adjust these terms?`
      }
    ]);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || typing) return;

    const userMessage = userInput;
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);
    setUserInput("");
    setTyping(true);

    try {
      // Map message log to system format
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await negotiateChat({
        document_id: selectedDocId,
        clause_title: selectedClauseTitle,
        clause_text: clauseText,
        counterparty_name: counterpartyName,
        personality_profile: personality,
        history: history,
        user_message: userMessage
      });

      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
      setAgreementPct(res.agreement_percentage);
      if (res.counter_proposal) {
        setCounterProposal(res.counter_proposal);
      }
      setContentionPoints(res.points_of_contention || []);
    } catch (err) {
      console.error("Negotiation chat failed:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error communicating with the negotiator agent. Please ensure the backend server is active." }]);
    } finally {
      setTyping(false);
    }
  };

  const handleApplyCounterProposal = () => {
    if (!counterProposal) return;
    setClauseText(counterProposal);
    setCounterProposal("");
    alert("Applied counterparty proposal to your active draft!");
  };

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
        {/* Header Toolbar */}
        <div className="p-4 bg-white border border-border rounded-lg shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h1 className="text-base font-bold text-primary">{t("title", "negotiator")}</h1>
          </div>
          {negotiationActive && (
            <button
              onClick={() => setNegotiationActive(false)}
              className="px-3 py-1.5 border border-border text-text-secondary hover:text-primary text-[11px] font-semibold rounded transition-colors"
            >
              Reset Sandbox
            </button>
          )}
        </div>

        {/* Sandbox setup panel */}
        {!negotiationActive && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
            {/* Configuration Settings */}
            <div className="lg:col-span-5 bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <h3 className="font-bold text-[13px] text-primary flex items-center gap-1.5 border-b border-border pb-2">
                  <Settings className="w-4 h-4" />
                  <span>Negotiation Settings</span>
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Select Contract</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="px-3 py-2 border border-border rounded text-xs focus:outline-none focus:border-primary"
                  >
                    {loadingDocs ? (
                      <option>Loading documents...</option>
                    ) : (
                      documents.map((d) => (
                        <option key={d.document_id} value={d.document_id}>
                          {d.filename}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Clause to Negotiate</label>
                  <select
                    value={selectedClauseTitle}
                    onChange={(e) => handleClauseChange(e.target.value)}
                    className="px-3 py-2 border border-border rounded text-xs focus:outline-none focus:border-primary"
                  >
                    {clauses.map((c, idx) => (
                      <option key={idx} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                    {clauses.length === 0 && (
                      <>
                        <option value="Indemnification">Indemnification</option>
                        <option value="Limitation of Liability">Limitation of Liability</option>
                        <option value="Governing Law">Governing Law</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Counterparty Name</label>
                  <input
                    type="text"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    className="px-3 py-2 border border-border rounded text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Counterparty Personality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Collaborative", "Conservative", "Aggressive"].map((p) => {
                      const isActive = personality === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPersonality(p)}
                          className={`py-2 border text-[11px] font-bold rounded-lg transition-all duration-300 transform active:scale-95 cursor-pointer ${
                            isActive
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-102"
                              : "bg-white text-text-secondary border-border hover:border-primary/50 hover:bg-slate-50/50 hover:-translate-y-0.5"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartNegotiation}
                disabled={!selectedDocId}
                className="w-full py-2.5 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer shadow-md shadow-primary/10 mt-6 active:scale-98 disabled:opacity-50"
              >
                Start Sandbox Negotiation
              </button>
            </div>

            {/* Welcome banner info */}
            <div className="lg:col-span-7 border border-dashed border-border bg-slate-50/20 rounded-lg p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[14px] text-primary">Negotiate Smarter With AI Sandboxing</h3>
              <p className="text-[12px] text-text-secondary mt-1.5 max-w-md leading-relaxed">
                Test drafts against specific negotiator personalities. Refine sensitive liability caps, governing laws, or IP clauses before talking with your real counterparties, and see how close you are to reaching consensus.
              </p>
            </div>
          </div>
        )}

        {/* Negotiation sandbox active grid */}
        {negotiationActive && (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left Pane: Clause active draft */}
            <div className="w-80 bg-white border border-border rounded-lg p-4 flex flex-col overflow-hidden shadow-xs shrink-0">
              <h3 className="font-bold text-[12px] text-primary uppercase border-b border-border pb-2 mb-3">
                Active Clause Draft
              </h3>
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Wording</label>
                <textarea
                  value={clauseText}
                  onChange={(e) => setClauseText(e.target.value)}
                  className="flex-1 p-3 border border-border rounded text-[11.5px] leading-relaxed font-mono focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-[10px] text-text-secondary italic">
                  Tip: Edit the draft above directly and explain your changes in the chat to see if counterparty counsel accepts them.
                </p>
              </div>
            </div>

            {/* Center Pane: Conversational Chat Terminal */}
            <div className="flex-1 bg-white border border-border rounded-lg flex flex-col overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-border flex items-center gap-2 shrink-0">
                <Bot className="w-4.5 h-4.5 text-primary" />
                <span className="font-bold text-[12.5px] text-primary">
                  Negotiating: {selectedClauseTitle}
                </span>
                <span className="ml-auto text-[10px] font-semibold text-text-secondary bg-primary-100/50 px-2 py-0.5 rounded uppercase">
                  Agent: {counterpartyName} ({personality})
                </span>
              </div>

              {/* Chat messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "self-start"}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                      m.role === "user" 
                        ? "bg-primary text-white border-primary" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-800"
                    }`}>
                      {m.role === "user" ? "ME" : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-lg text-[11.5px] leading-relaxed shadow-xs ${
                      m.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white border border-border text-primary rounded-tl-none"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex gap-3 max-w-[80%] self-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-800 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 bg-white border border-border rounded rounded-tl-none flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message input */}
              <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-border flex gap-2 shrink-0">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={typing}
                  placeholder={`Offer a compromise or defend your clause draft to ${counterpartyName}...`}
                  className="flex-1 px-3 py-2 border border-border rounded text-xs bg-slate-50 focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || typing}
                  className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Right Pane: Agreement Status Dashboard */}
            <div className="w-80 bg-white border border-border rounded-lg p-4 flex flex-col overflow-hidden shadow-xs shrink-0 gap-4">
              
              {/* Consensus meter */}
              <div className="border border-border rounded-lg p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider mb-3">Consensus Level</h4>
                
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Gauge indicator */}
                  {(() => {
                    const strokeColor = agreementPct >= 70 
                      ? "var(--color-risk-green)" 
                      : agreementPct >= 40 
                        ? "var(--color-risk-amber)" 
                        : "var(--color-risk-red)";
                    return (
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="var(--color-slate-200)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={strokeColor}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * agreementPct) / 100}
                          style={{
                            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.8s ease"
                          }}
                        />
                      </svg>
                    );
                  })()}
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-primary leading-none">{agreementPct}%</span>
                    <span className="block text-[8px] text-text-secondary uppercase font-bold mt-0.5">Agreement</span>
                  </div>
                </div>

                <p className="text-[10px] text-text-secondary mt-3.5 leading-relaxed">
                  {agreementPct === 100
                    ? "Agreement reached! You can now copy the finalized draft into your contract."
                    : `Currently reviewing proposals. Reach 100% agreement to conclude negotiations.`}
                </p>
              </div>

              {/* Contention bullets */}
              <div className="flex-1 flex flex-col min-h-0 border border-border rounded-lg p-4">
                <h4 className="font-bold text-[11px] text-primary uppercase tracking-wider mb-2 border-b border-border pb-1">
                  Remaining Objections
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 pt-1">
                  {contentionPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                      <AlertCircle className="w-3.5 h-3.5 text-risk-amber shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                  {contentionPoints.length === 0 && agreementPct === 100 && (
                    <div className="flex items-start gap-1.5 text-[11px] text-risk-green font-semibold">
                      <Award className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>No pending objections. Signing off!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Counter Proposal Card */}
              {counterProposal && (
                <div className="border border-primary-200 bg-primary-50/10 rounded-lg p-3 shrink-0 flex flex-col gap-2 animate-in slide-in-from-bottom duration-250">
                  <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Counterparty Counter-Proposal</span>
                  </h4>
                  <p className="text-[10px] leading-relaxed text-text-secondary italic font-mono bg-white p-2 border border-border max-h-24 overflow-y-auto">
                    {counterProposal}
                  </p>
                  <button
                    onClick={handleApplyCounterProposal}
                    className="w-full py-1 text-center bg-primary text-white text-[10px] font-bold rounded hover:bg-primary-light transition-colors"
                  >
                    Apply Counterparty Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
