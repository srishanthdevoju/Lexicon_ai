import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
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
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      change: "Documents analyzed",
      trend: "up",
      icon: FileText,
      color: "text-primary bg-primary-100"
    },
    {
      label: "High Risk",
      value: String(highRiskDocs),
      change: "Documents flagged",
      trend: "stable",
      icon: AlertTriangle,
      color: "text-risk-red bg-risk-red-light"
    },
    {
      label: "Completed",
      value: String(completedDocs),
      change: "Analyses finished",
      trend: "up",
      icon: CheckCircle2,
      color: "text-risk-green bg-risk-green-light"
    },
    {
      label: "Avg Risk Score",
      value: totalDocs > 0 
        ? (analyses.reduce((sum, a) => sum + (parseFloat(a.risk_score) || 0), 0) / totalDocs).toFixed(1) 
        : "0.0",
      change: "Across all documents",
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

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Executive Dashboard</h1>
            <p className="text-[13px] text-text-secondary">
              Real-time portfolio intelligence, contract risks, and compliance status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-[13px] text-text-secondary hover:text-primary rounded transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Workspace</span>
            </button>
            <button 
              onClick={() => navigate("/upload")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
            >
              <span>Analyze Contract</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-white border border-border rounded p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
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
              <h3 className="font-semibold text-[15px] text-primary">Recent Analyses</h3>
              <p className="text-[11px] text-text-secondary">Latest documents analyzed by Lexicon AI.</p>
            </div>
            <button 
              onClick={() => navigate("/history")}
              className="text-[12px] font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 text-text-muted mb-2" />
              <p className="text-[13px] text-text-secondary">No documents analyzed yet.</p>
              <button
                onClick={() => navigate("/upload")}
                className="mt-3 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {analyses.slice(0, 5).map((item, idx) => {
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
                    className="p-5 flex items-center justify-between hover:bg-primary-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded bg-primary-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-border transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[13px] text-primary">{item.filename || "Untitled"}</h4>
                        <p className="text-[11px] text-text-secondary mt-0.5">{item.document_type || "Unknown Type"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-xs text-text-secondary">{formatDate(item.created_at)}</span>
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
