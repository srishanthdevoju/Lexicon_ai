import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { listAnalyses, getAppointments } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/LanguageContext";
import { 
  FileText, 
  AlertTriangle, 
  Binary, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Filter,
  BarChart3,
  RefreshCw,
  Sparkles,
  ArrowLeftRight
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { t } = useTranslation();
  
  const [analyses, setAnalyses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [lawyerInfo, setLawyerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      try {
        const result = await listAnalyses({ limit: 20 });
        setAnalyses(result.analyses || []);

        const appts = await getAppointments().catch(() => []);
        setAppointments(appts || []);

        if (userRole === "lawyer") {
          const { data } = await supabase
            .from("clients")
            .select("id, name, email, created_at")
            .eq("lawyer_id", user.id);
          setClientsList(data || []);
        } else if (userRole === "client") {
          const { data } = await supabase
            .from("clients")
            .select("lawyers(name, email, specialty)")
            .eq("id", user.id)
            .single();
          if (data && data.lawyers) {
            setLawyerInfo(data.lawyers);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, userRole]);

  // Calculate real metrics from analyses data
  const totalDocs = analyses.length;
  const highRiskDocs = analyses.filter(a => a.risk_score >= 6).length;
  const completedDocs = analyses.filter(a => a.status === "completed").length;

  const metrics = [
    {
      label: t("totalDocs", "dashboard"),
      value: String(totalDocs),
      change: userRole === "client" ? t("sharedWithYou", "dashboard") : t("docsAnalyzed", "dashboard"),
      trend: "up",
      icon: FileText,
      color: "text-primary bg-primary-100"
    },
    {
      label: t("highRisk", "dashboard"),
      value: String(highRiskDocs),
      change: t("criticalAdjustments", "dashboard"),
      trend: "stable",
      icon: AlertTriangle,
      color: "text-risk-red bg-risk-red-light"
    },
    {
      label: t("completed", "dashboard"),
      value: String(completedDocs),
      change: t("analysesFinalized", "dashboard"),
      trend: "up",
      icon: CheckCircle2,
      color: "text-risk-green bg-risk-green-light"
    },
    {
      label: t("avgRisk", "dashboard"),
      value: totalDocs > 0 
        ? (analyses.reduce((sum, a) => sum + (parseFloat(a.risk_score) || 0), 0) / totalDocs).toFixed(1) 
         : "0.0",
      change: t("acrossActiveMatters", "dashboard"),
      trend: "stable",
      icon: Binary,
      color: "text-risk-blue bg-risk-blue-light"
    }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return t("unknown", "common") || "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return t("justNow", "dashboard");
    if (diffHours < 24) return `${diffHours} ${t("hoursAgo", "dashboard")}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t("yesterday", "dashboard");
    return `${diffDays} ${t("daysAgo", "dashboard")}`;
  };

  const handleCheckboxToggle = (e, docId) => {
    e.stopPropagation();
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleCompareClick = () => {
    if (selectedDocs.length < 2) return;
    navigate(`/split-view?docA=${selectedDocs[0]}&docB=${selectedDocs[1]}`);
  };

  // Get current user display name
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              {t("welcome", "common")}, {displayName}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {userRole === "client" 
                ? t("subClient", "dashboard") 
                : t("subLawyer", "dashboard")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Contextual Action: Compare button */}
            {userRole === "lawyer" && (
              <button 
                onClick={handleCompareClick}
                disabled={selectedDocs.length < 2}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[13px] font-semibold transition-all shadow-xs ${
                  selectedDocs.length >= 2 
                    ? "bg-amber-500 border-amber-600 text-white hover:bg-amber-600" 
                    : "bg-white border-border text-text-secondary opacity-60 cursor-not-allowed"
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{t("compareSelected", "dashboard")} ({selectedDocs.length})</span>
              </button>
            )}
            
            {userRole === "lawyer" && (
              <button 
                onClick={() => navigate("/upload")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors shadow-xs"
              >
                <span>{t("analyzeContract", "dashboard")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-white border border-border rounded p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${metric.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold tracking-tight text-primary">{metric.value}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-secondary">
                    {metric.trend === "up" && <TrendingUp className="w-3 h-3 text-risk-green" />}
                    <span>{metric.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Layout Grid: Recent Activities (2/3 width) + Sidebar Widgets (1/3 width) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Recent Activities / Shared Documents */}
          <div className="lg:col-span-8 bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[14px] text-primary">
                  {userRole === "client" ? t("sharedAgreements", "dashboard") : t("recentAnalyses", "dashboard")}
                </h3>
                <p className="text-[11px] text-text-secondary">
                  {userRole === "client" ? t("briefsAvailable", "dashboard") : t("historySub", "dashboard")}
                </p>
              </div>
              
              {userRole === "lawyer" && (
                <button 
                  onClick={() => navigate("/history")}
                  className="text-[12px] font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>{t("allHistory", "dashboard")}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-[13px] text-text-secondary">{t("noDocs", "dashboard")}</p>
                {userRole === "lawyer" && (
                  <button
                    onClick={() => navigate("/upload")}
                    className="mt-3 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
                  >
                    {t("uploadFirst", "dashboard")}
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {analyses.slice(0, 8).map((item, idx) => {
                  const riskScore = parseFloat(item.risk_score) || 0;
                  const statusColor = riskScore >= 6
                    ? "bg-risk-red-light text-risk-red border-risk-red/10"
                    : riskScore >= 3
                      ? "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                      : "bg-risk-green-light text-risk-green border-risk-green/10";
                  const statusLabel = riskScore >= 6 ? t("highRisk", "dashboard") : riskScore >= 3 ? t("moderate", "dashboard") : t("lowRisk", "dashboard");

                  return (
                    <div 
                      key={idx} 
                      onClick={() => navigate(`/analysis/${item.document_id}`)}
                      className="p-4 flex items-center justify-between hover:bg-primary-50/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox for side-by-side selection */}
                        {userRole === "lawyer" && (
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(item.document_id)}
                            onChange={(e) => handleCheckboxToggle(e, item.document_id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 shrink-0 cursor-pointer mr-2"
                          />
                        )}
                        
                        <div className="w-9 h-9 rounded bg-primary-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-border transition-colors shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[13px] text-primary truncate">{item.filename || "Untitled"}</h4>
                          <p className="text-[10px] text-text-secondary mt-0.5">{item.document_type || "Unknown Type"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {item.notes_count > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 rounded font-semibold">
                              {item.notes_count} {item.notes_count > 1 ? t("notesPluralLabel", "dashboard") : t("notesLabel", "dashboard")}
                            </span>
                          )}
                          <Clock className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
                          <span className="text-xs text-text-secondary hidden sm:inline">{formatDate(item.created_at)}</span>
                          <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Widget 1: Partner Role Details */}
            {userRole === "client" ? (
              <div className="bg-white border border-border rounded p-5 shadow-sm space-y-3">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("myCounsel", "dashboard")}</h3>
                {lawyerInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-primary-100 border border-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold font-sans">
                        {lawyerInfo.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[13px] text-primary">{lawyerInfo.name}</h4>
                        <p className="text-[10px] text-text-secondary">{lawyerInfo.specialty || "Legal Advisor"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-1 text-[11px]">
                      <button 
                        onClick={() => navigate("/messages")}
                        className="w-full py-1.5 text-center bg-primary text-white font-semibold rounded hover:bg-primary-light transition-colors"
                      >
                        {t("messageCounsel", "dashboard")}
                      </button>
                      <button 
                        onClick={() => navigate("/appointments")}
                        className="w-full py-1.5 text-center bg-white border border-border text-text-secondary hover:text-primary hover:border-primary font-semibold rounded transition-colors"
                      >
                        {t("scheduleMeeting", "dashboard")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">{t("retrievingCounsel", "dashboard")}</p>
                )}
              </div>
            ) : (
              <div className="bg-white border border-border rounded p-5 shadow-sm space-y-3">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("myClients", "dashboard")}</h3>
                {clientsList.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-1">{t("noClients", "dashboard")}</p>
                ) : (
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {clientsList.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate">{c.name}</p>
                          <p className="text-[10px] text-text-secondary truncate">{c.email}</p>
                        </div>
                        <span className="text-[9px] text-text-muted">{formatDate(c.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Widget 2: Upcoming Consultations */}
            <div className="bg-white border border-border rounded p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("consultations", "dashboard")}</h3>
                <button 
                  onClick={() => navigate("/appointments")}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  {t("manage", "dashboard")}
                </button>
              </div>

              {appointments.filter(a => a.status === "scheduled").length === 0 ? (
                <div className="text-center py-4 bg-slate-50 border border-border/40 rounded">
                  <p className="text-[11px] text-text-muted italic">{t("noUpcoming", "dashboard")}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {appointments
                    .filter(a => a.status === "scheduled")
                    .slice(0, 3)
                    .map((appt) => (
                      <div 
                        key={appt.id} 
                        onClick={() => navigate("/appointments")}
                        className="p-2.5 bg-slate-50 hover:bg-primary-50 border border-border/60 hover:border-primary/20 rounded cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-semibold text-xs text-primary truncate leading-tight">{appt.title}</h4>
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded shrink-0">
                            {appt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                          <span>{appt.appointment_date}</span>
                          <span>{appt.appointment_time}</span>
                        </div>
                        <p className="text-[10px] text-primary">
                          {userRole === "client" ? `${t("counsel", "dashboard")}: ${appt.lawyer_name || "Counsel"}` : `${t("client", "dashboard")}: ${appt.client_name || "Client"}`}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Widget 3: Contract Risk Breakdown */}
            {analyses.length > 0 && (
              <div className="bg-white border border-border rounded p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("riskBreakdown", "dashboard")}</h3>
                <div className="space-y-3">
                  {/* High Risk */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{t("highRiskScore", "dashboard")}</span>
                      <span className="font-semibold text-risk-red">{highRiskDocs} ({totalDocs > 0 ? ((highRiskDocs / totalDocs) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-risk-red h-full" style={{ width: `${totalDocs > 0 ? (highRiskDocs / totalDocs) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  {/* Moderate Risk */}
                  {(() => {
                    const modRiskDocs = analyses.filter(a => a.risk_score >= 3 && a.risk_score < 6).length;
                    return (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">{t("modRiskScore", "dashboard")}</span>
                          <span className="font-semibold text-risk-amber">{modRiskDocs} ({totalDocs > 0 ? ((modRiskDocs / totalDocs) * 100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-risk-amber h-full" style={{ width: `${totalDocs > 0 ? (modRiskDocs / totalDocs) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Low Risk */}
                  {(() => {
                    const lowRiskDocs = analyses.filter(a => (parseFloat(a.risk_score) || 0) < 3).length;
                    return (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">{t("lowRiskScore", "dashboard")}</span>
                          <span className="font-semibold text-risk-green">{lowRiskDocs} ({totalDocs > 0 ? ((lowRiskDocs / totalDocs) * 100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-risk-green h-full" style={{ width: `${totalDocs > 0 ? (lowRiskDocs / totalDocs) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Widget 4: LexiconAI Tips & Best Practices */}
            <div className="bg-white border border-border rounded p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t("tips", "dashboard")}</h3>
              </div>
              <div className="space-y-3.5 text-xs text-text-secondary leading-relaxed">
                {userRole === "lawyer" ? (
                  <>
                    <div className="p-2.5 bg-primary-50/50 rounded border border-primary/10">
                      <p className="font-semibold text-primary mb-1">{t("tip1Title", "dashboard")}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{t("tip1Desc", "dashboard")}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-100/10">
                      <p className="font-semibold text-emerald-800 mb-1">{t("tip2Title", "dashboard")}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{t("tip2Desc", "dashboard")}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-primary-50/50 rounded border border-primary/10">
                      <p className="font-semibold text-primary mb-1">{t("tip3Title", "dashboard")}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{t("tip3Desc", "dashboard")}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50/50 rounded border border-amber-100/10">
                      <p className="font-semibold text-amber-800 mb-1">{t("tip4Title", "dashboard")}</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{t("tip4Desc", "dashboard")}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}
