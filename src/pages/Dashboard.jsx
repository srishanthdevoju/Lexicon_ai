import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { listAnalyses } from "@/lib/api";
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
  
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await listAnalyses({ limit: 20 });
        setAnalyses(result.analyses || []);
      } catch (err) {
        console.error("Failed to fetch analyses:", err);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate real metrics from analyses data
  const totalDocs = analyses.length;
  const highRiskDocs = analyses.filter(a => a.risk_score >= 6).length;
  const completedDocs = analyses.filter(a => a.status === "completed").length;

  const metrics = [
    {
      label: "Total Documents",
      value: String(totalDocs),
      change: userRole === "client" ? "Shared with you" : "Documents analyzed",
      trend: "up",
      icon: FileText,
      color: "text-primary bg-primary-100"
    },
    {
      label: "High Risk",
      value: String(highRiskDocs),
      change: "Critical adjustments required",
      trend: "stable",
      icon: AlertTriangle,
      color: "text-risk-red bg-risk-red-light"
    },
    {
      label: "Completed",
      value: String(completedDocs),
      change: "Analyses finalized",
      trend: "up",
      icon: CheckCircle2,
      color: "text-risk-green bg-risk-green-light"
    },
    {
      label: "Avg Risk Score",
      value: totalDocs > 0 
        ? (analyses.reduce((sum, a) => sum + (parseFloat(a.risk_score) || 0), 0) / totalDocs).toFixed(1) 
        : "0.0",
      change: "Across active matters",
      trend: "stable",
      icon: Binary,
      color: "text-risk-blue bg-risk-blue-light"
    }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
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
              Welcome back, {displayName}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {userRole === "client" 
                ? "View documents and analyses shared by your lawyer." 
                : "Real-time portfolio intelligence, contract risks, and compliance status."}
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
                <span>Compare Selected ({selectedDocs.length})</span>
              </button>
            )}
            
            {userRole === "lawyer" && (
              <button 
                onClick={() => navigate("/upload")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors shadow-xs"
              >
                <span>Analyze Contract</span>
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

        {/* Recent Activities Section */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[14px] text-primary">
                {userRole === "client" ? "Shared Agreements" : "Recent Analyses"}
              </h3>
              <p className="text-[11px] text-text-secondary">
                {userRole === "client" ? "Latest contract audit briefs available for review." : "Select two files to enable side-by-side comparison."}
              </p>
            </div>
            
            {userRole === "lawyer" && (
              <button 
                onClick={() => navigate("/history")}
                className="text-[12px] font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>All History</span>
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
              <p className="text-[13px] text-text-secondary">No documents analyzed yet.</p>
              {userRole === "lawyer" && (
                <button
                  onClick={() => navigate("/upload")}
                  className="mt-3 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
                >
                  Upload Your First Document
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
                const statusLabel = riskScore >= 6 ? "High Risk" : riskScore >= 3 ? "Moderate" : "Low Risk";

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
                            {item.notes_count} note{item.notes_count > 1 ? "s" : ""}
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
      </div>
    </Shell>
  );
}
