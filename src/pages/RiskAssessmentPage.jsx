import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { getAnalysis } from "@/lib/api";
import { 
  ArrowLeft, 
  AlertCircle,
  Lightbulb,
  RefreshCw
} from "lucide-react";

export default function RiskAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        setError(err.response?.data?.detail || "Failed to load risk assessment.");
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
            <span className="text-[13px] text-text-secondary">Loading risk assessment...</span>
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
            <p className="text-[13px] text-text-secondary">{error || "Could not load risk data."}</p>
          </div>
        </div>
      </Shell>
    );
  }

  const { risks } = analysis;
  const highRisks = risks?.filter(r => r.severity?.toLowerCase() === "high" || r.is_critical) || [];
  const medRisks = risks?.filter(r => r.severity?.toLowerCase() === "medium") || [];
  const lowRisks = risks?.filter(r => r.severity?.toLowerCase() === "low") || [];
  const totalRisks = risks?.length || 0;

  // Calculate overall risk score from severity weights
  const riskScore = totalRisks > 0
    ? ((risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / (totalRisks * 3)) * 10).toFixed(1)
    : "0.0";

  const riskLabel = parseFloat(riskScore) >= 7 ? "High Risk" : parseFloat(riskScore) >= 4 ? "Moderate Risk" : "Low Risk";
  const riskColor = parseFloat(riskScore) >= 7 ? "risk-red" : parseFloat(riskScore) >= 4 ? "risk-amber" : "risk-green";

  // Distribution data
  const riskDistribution = [
    { label: "Critical Risks", count: highRisks.length, color: "bg-risk-red", percentage: totalRisks > 0 ? Math.round((highRisks.length / totalRisks) * 100) : 0 },
    { label: "Medium Risks", count: medRisks.length, color: "bg-risk-amber", percentage: totalRisks > 0 ? Math.round((medRisks.length / totalRisks) * 100) : 0 },
    { label: "Low Risks", count: lowRisks.length, color: "bg-risk-green", percentage: totalRisks > 0 ? Math.round((lowRisks.length / totalRisks) * 100) : 0 }
  ];

  // Group risks by category for the exposure chart
  const riskByCategory = {};
  (risks || []).forEach(r => {
    const cat = r.title || "Other";
    if (!riskByCategory[cat]) {
      riskByCategory[cat] = { name: cat, score: r.severity_weight || 1, maxScore: 3 };
    }
  });
  const riskCategories = Object.values(riskByCategory)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(cat => ({
      ...cat,
      color: cat.score >= 3 ? "bg-risk-red" : cat.score >= 2 ? "bg-risk-amber" : "bg-risk-green",
      width: `${Math.round((cat.score / 3) * 100)}%`
    }));

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header & Back Action */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/analysis/${id}`)}
            className="p-1.5 border border-border bg-white rounded text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Risk Assessment</h1>
            <p className="text-[13px] text-text-secondary">
              Comprehensive exposure scorecard and mitigation recommendations.
            </p>
          </div>
        </div>

        {/* Top Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Overall Risk Index</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-bold text-${riskColor}`}>{riskScore}</span>
              <span className="text-md font-semibold text-text-secondary">/ 10</span>
              <span className={`ml-3 px-2 py-0.5 text-[10px] font-bold bg-${riskColor}-light text-${riskColor} rounded border border-${riskColor}/10 uppercase tracking-wider`}>
                {riskLabel}
              </span>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Risk Severity Count</span>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-red block">{highRisks.length}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Critical</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-amber block">{medRisks.length}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Medium</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <span className="text-2xl font-bold text-risk-green block">{lowRisks.length}</span>
                <span className="text-[10px] font-semibold text-text-secondary uppercase">Low</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Internal Conflict Index</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-amber-600">
                {analysis.inconsistency_score !== undefined ? analysis.inconsistency_score.toFixed(1) : "0.0"}
              </span>
              <span className="text-md font-semibold text-text-secondary">/ 10</span>
              <span className="ml-3 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200/50 uppercase tracking-wider">
                {analysis.inconsistencies?.length || 0} conflicts
              </span>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Total Risks Identified</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">{totalRisks}</span>
              <span className="text-[11px] text-text-secondary font-medium">across all severity levels</span>
            </div>
          </div>
        </div>

        {/* Distribution & Heatmap Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Distribution card */}
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Severity Distribution</h3>
            
            <div className="space-y-4">
              <div className="w-full h-4 bg-primary-100 rounded-full overflow-hidden flex">
                {riskDistribution.map((dist, idx) => (
                  dist.percentage > 0 && (
                    <div 
                      key={idx} 
                      className={`${dist.color} h-full`} 
                      style={{ width: `${dist.percentage}%` }}
                      title={`${dist.label}: ${dist.count}`}
                    ></div>
                  )
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[11px] text-text-secondary pt-2">
                {riskDistribution.map((dist, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 justify-center">
                    <span className={`w-2 h-2 rounded-full ${dist.color}`}></span>
                    <span>{dist.label} ({dist.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category score heatmap */}
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <h3 className="font-semibold text-[14px] text-primary mb-5">Exposure by Risk Item</h3>
            
            <div className="space-y-3">
              {riskCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-medium text-primary truncate max-w-[70%]">{cat.name}</span>
                    <span className="text-text-secondary font-semibold">{((cat.score / 3) * 10).toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.color}`} 
                      style={{ width: cat.width }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Contradictions & Inconsistencies Section */}
        {analysis.inconsistencies && analysis.inconsistencies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[14px] text-primary flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Internal Contract Contradictions</span>
            </h3>
            
            <div className="space-y-3">
              {analysis.inconsistencies.map((inc, idx) => (
                <div key={idx} className="bg-white border border-border rounded shadow-xs p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[13px] text-primary">{inc.title}</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded uppercase tracking-wider">
                      {inc.severity} Severity
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {inc.description}
                  </p>
                  {inc.affected_sections && inc.affected_sections.length > 0 && (
                    <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Affected:</span>
                      {inc.affected_sections.map((sec, sIdx) => (
                        <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Findings & Mitigation recommendations */}
        {risks && risks.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[14px] text-primary">Findings & Mitigation Plan</h3>
            
            <div className="space-y-4">
              {risks.map((risk, idx) => {
                const isHigh = risk.severity?.toLowerCase() === "high" || risk.is_critical;
                const isMed = risk.severity?.toLowerCase() === "medium";
                const badgeStyle = isHigh
                  ? "bg-risk-red-light text-risk-red border-risk-red/10"
                  : isMed
                    ? "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                    : "bg-risk-green-light text-risk-green border-risk-green/10";
                const impactLabel = isHigh ? "Critical Exposure" : isMed ? "Medium Exposure" : "Low Exposure";

                return (
                  <div key={idx} className="bg-white border border-border rounded shadow-xs overflow-hidden">
                    <div className="p-4 bg-primary-50/50 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-[13px] text-primary">{risk.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded uppercase tracking-wider ${badgeStyle}`}>
                        {impactLabel}
                      </span>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] leading-relaxed">
                      <div className="space-y-2 md:border-r border-border/60 md:pr-6">
                        <h5 className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Finding Description</h5>
                        <p className="text-primary">{risk.description}</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-risk-blue uppercase text-[10px] tracking-wider flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Severity Assessment</span>
                        </h5>
                        <p className="text-text-secondary font-medium">
                          Severity: {risk.severity} (Weight: {risk.severity_weight}/3)
                          {risk.is_critical && " — Flagged as critical by AI analysis."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
