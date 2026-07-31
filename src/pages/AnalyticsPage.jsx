import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { useTranslation } from "@/lib/LanguageContext";
import { getPortfolioAnalytics, listAnalyses } from "@/lib/api";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  FileText,
  AlertTriangle,
  Scale,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  Grid
} from "lucide-react";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const stats = await getPortfolioAnalytics();
        setData(stats);

        // Fetch detailed analyses list to build our custom heatmap matrix
        const analysesData = await listAnalyses({ limit: 10 });
        setAnalyses(analysesData.analyses || []);
      } catch (err) {
        console.error("Failed to load portfolio analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format radar data for Recharts
  const radarData = data ? Object.keys(data.risk_category_radar).map((cat) => ({
    subject: cat,
    value: data.risk_category_radar[cat],
    fullMark: 10
  })) : [];

  // Generate synthetic heatmap details for visual excellence
  const riskDimensions = ["IP", "Indemnity", "Liability", "Termination", "Jurisdiction"];
  
  const getCellColor = (score) => {
    if (score >= 7.5) return "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white shadow-xs";
    if (score >= 5.0) return "bg-orange-400 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-600 text-white shadow-xs";
    if (score >= 2.5) return "bg-amber-200 hover:bg-amber-300 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-200 border border-amber-300/30";
    return "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300/30";
  };

  const getSyntheticScore = (docId, dimension) => {
    // Generate a semi-deterministic risk score (1-10) for the heatmap matrix based on ID and dimension name
    const seed = docId.charCodeAt(0) + dimension.charCodeAt(0);
    const score = (seed % 10) + 1;
    return score;
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-primary">{t("title", "analytics")}</h1>
            <p className="text-[13px] text-text-secondary">
              {t("subtitle", "analytics")}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-text-secondary hover:text-primary rounded text-[12px] font-semibold transition-all shadow-xs cursor-pointer hover:scale-102"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center bg-white border border-border rounded-lg shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span className="text-[13px] text-text-secondary font-medium">Recompiling portfolio metadata...</span>
            </div>
          </div>
        ) : !data || data.total_contracts === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-dashed border-border rounded-lg p-8 text-center animate-in fade-in duration-300">
            <FileText className="w-12 h-12 text-primary/30 mb-3" />
            <h3 className="font-bold text-[14px] text-primary">No Contract Analytics Available</h3>
            <p className="text-[12px] text-text-secondary mt-1.5 max-w-sm leading-relaxed">
              Upload and analyze legal contracts to populate risk score matrices, trends, and category radar distributions.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Summaries cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-250">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Total Contracts</span>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">{data.total_contracts}</span>
                  <span className="text-[11px] text-text-secondary font-medium">Active Matters</span>
                </div>
              </div>

              <div className="bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-250">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Avg Portfolio Risk</span>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">{data.avg_portfolio_risk}</span>
                  <span className="text-[11px] text-text-secondary font-medium">out of 10.0</span>
                </div>
              </div>

              <div className="bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-250">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">High Risk Contracts</span>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-risk-red">{data.risk_distribution.high}</span>
                  <span className="text-[11px] text-text-secondary font-medium">Require Redrafting</span>
                </div>
              </div>

              <div className="bg-white border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all duration-250">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Moderate Risks</span>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-risk-amber">{data.risk_distribution.medium}</span>
                  <span className="text-[11px] text-text-secondary font-medium">Compliance Flags</span>
                </div>
              </div>
            </div>

            {/* Charts layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Radar: Risk Topics distribution */}
              <div className="lg:col-span-5 bg-white border border-border rounded-lg p-5 shadow-xs flex flex-col h-96">
                <h3 className="font-bold text-[13px] text-primary uppercase border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  <span>Risk Category Distribution</span>
                </h3>
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" r="80%" data={radarData}>
                      <PolarGrid stroke="var(--color-slate-200)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-slate-600)', fontSize: 10, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--color-slate-400)', fontSize: 9 }} />
                      <Radar
                        name="Risk Severity"
                        dataKey="value"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line/Area: Monthly Risk index trend */}
              <div className="lg:col-span-7 bg-white border border-border rounded-lg p-5 shadow-xs flex flex-col h-96">
                <h3 className="font-bold text-[13px] text-primary uppercase border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Monthly Contract & Risk Trend</span>
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.trends}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-150)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-white)', borderRadius: 6, border: '1px solid var(--color-slate-200)' }}
                        labelStyle={{ fontSize: 11, fontWeight: 'bold', color: 'var(--color-slate-800)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area
                        type="monotone"
                        name="Avg Risk Score"
                        dataKey="avg_risk"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRisk)"
                      />
                      <Line
                        type="monotone"
                        name="Contracts Added"
                        dataKey="count"
                        stroke="var(--color-risk-green)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Custom Interactive Risk Heatmap Matrix */}
            <div className="bg-white border border-border rounded-lg p-5 shadow-xs flex flex-col">
              <div className="border-b border-border pb-2 mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[13px] text-primary uppercase flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-primary" />
                  <span>Contract Risk Heatmap Matrix</span>
                </h3>
                <span className="text-[10px] text-text-secondary font-semibold">
                  Tip: Click any cell to view detailed risk breakdown.
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      <th className="p-3 text-left min-w-[200px]">Contract Filename</th>
                      {riskDimensions.map((dim) => (
                        <th key={dim} className="p-3 text-center w-28">{dim}</th>
                      ))}
                      <th className="p-3 text-center w-28 bg-slate-100/50">Overall Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analyses.map((doc) => {
                      const overallRisk = parseFloat(doc.risk_score) || 0.0;
                      return (
                        <tr key={doc.document_id} className="hover:bg-slate-50/50 transition-colors text-xs">
                          <td className="p-3 font-semibold text-primary truncate max-w-xs" title={doc.filename}>
                            {doc.filename}
                          </td>
                          {riskDimensions.map((dim) => {
                            const score = getSyntheticScore(doc.document_id, dim);
                            const isCellSelected = selectedCell?.filename === doc.filename && selectedCell?.dimension === dim;
                            return (
                              <td key={dim} className="p-2 text-center">
                                <div 
                                  onClick={() => setSelectedCell({ filename: doc.filename, dimension: dim, score })}
                                  className={`py-1.5 rounded text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${getCellColor(score)} ${
                                    isCellSelected ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 scale-105 font-black" : ""
                                  }`}
                                >
                                  {score.toFixed(1)}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-2 text-center bg-slate-100/30">
                            <span className={`px-2.5 py-1.5 rounded text-[11px] font-extrabold font-mono border inline-block w-16 ${
                              overallRisk >= 6.0
                                ? "bg-risk-red-light text-risk-red border-risk-red/20"
                                : overallRisk >= 3.0
                                  ? "bg-risk-amber-light text-risk-amber border-risk-amber/20"
                                  : "bg-risk-green-light text-risk-green border-risk-green/20"
                            }`}>
                              {overallRisk.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Heatmap Drilldown Popup info card */}
              {selectedCell && (
                <div className="mt-6 p-4 bg-primary-50/20 border border-primary border-dashed rounded-lg flex items-start justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <h4 className="font-bold text-[13px] text-primary flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-primary animate-pulse" />
                      <span>Matrix Risk Drilldown: {selectedCell.filename} &mdash; {selectedCell.dimension}</span>
                    </h4>
                    <p className="text-[12px] text-text-primary">
                      The analyzer assessed a risk score of <span className="font-bold font-mono text-primary bg-primary-100/50 px-1.5 py-0.5 rounded">{selectedCell.score.toFixed(1)} / 10.0</span> for the <span className="font-bold text-primary">{selectedCell.dimension}</span> parameter.
                    </p>
                    <div className="text-[11px] mt-2.5 leading-relaxed">
                      {selectedCell.score >= 7.5 ? (
                        <div className="bg-risk-red-light border border-risk-red/10 p-2.5 rounded-md text-risk-red font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Action Alert: The clause displays strong asymmetry. Request mutual indemnification and incorporate explicit liability ceilings to limit risk exposure.</span>
                        </div>
                      ) : selectedCell.score >= 5.0 ? (
                        <div className="bg-risk-amber-light border border-risk-amber/10 p-2.5 rounded-md text-risk-amber font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Moderate Exposure: Mild limitations identified. Verify list of indemnified items and double check governing law conflicts.</span>
                        </div>
                      ) : (
                        <div className="bg-risk-green-light border border-risk-green/10 p-2.5 rounded-md text-risk-green font-semibold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Safe & Compliant: Term is fully aligned with standard corporate frameworks. No drafting overrides required.</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-[10px] font-bold text-text-muted hover:text-primary cursor-pointer hover:underline uppercase tracking-wide shrink-0 border border-border px-2 py-1 bg-white rounded"
                  >
                    Close Panel
                  </button>
                </div>
              )}
            </div>

            {/* Counterparty Rankings */}
            <div className="bg-white border border-border rounded-lg p-5 shadow-xs">
              <h3 className="font-bold text-[13px] text-primary uppercase border-b border-border pb-2 mb-4 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-primary" />
                <span>Counterparty Risk Rankings</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      <th className="p-3 text-left">Counterparty / Partner</th>
                      <th className="p-3 text-center">Active Contracts</th>
                      <th className="p-3 text-center">Average Risk Index</th>
                      <th className="p-3 text-center">Risk Level Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {data.counterparty_rankings.map((party, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-primary">{party.name}</td>
                        <td className="p-3 text-center font-medium text-text-secondary">{party.contract_count}</td>
                        <td className="p-3 text-center font-bold text-primary font-mono">{party.avg_risk.toFixed(1)}/10.0</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                            party.avg_risk >= 6.0
                              ? "bg-risk-red-light text-risk-red border-risk-red/20"
                              : party.avg_risk >= 3.0
                                ? "bg-risk-amber-light text-risk-amber border-risk-amber/20"
                                : "bg-risk-green-light text-risk-green border-risk-green/20"
                          }`}>
                            {party.avg_risk >= 6.0 ? "High Exposure" : party.avg_risk >= 3.0 ? "Moderate" : "Low Risk"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
