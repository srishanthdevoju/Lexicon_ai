import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockAnalysisResult } from "@/data/mockData";

const severityConfig = {
  High: {
    variant: "high",
    icon: ShieldAlert,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    borderColor: "border-red-100",
    countBg: "bg-red-50",
    countText: "text-red-700",
    dotColor: "bg-red-500",
  },
  Medium: {
    variant: "medium",
    icon: AlertTriangle,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    borderColor: "border-orange-100",
    countBg: "bg-orange-50",
    countText: "text-orange-700",
    dotColor: "bg-orange-500",
  },
  Low: {
    variant: "low",
    icon: ShieldCheck,
    bg: "bg-green-50",
    iconColor: "text-green-500",
    borderColor: "border-green-100",
    countBg: "bg-green-50",
    countText: "text-green-700",
    dotColor: "bg-green-500",
  },
};

export default function RiskAnalysis() {
  const risks = mockAnalysisResult.data.risks;

  const riskCounts = {
    High: risks.filter((r) => r.severity === "High").length,
    Medium: risks.filter((r) => r.severity === "Medium").length,
    Low: risks.filter((r) => r.severity === "Low").length,
  };

  // Sort: High first, then Medium, then Low
  const sortedRisks = [...risks].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <TrendingUp className="w-[18px] h-[18px] text-red-500" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold text-text">Risk Analysis</h3>
            <p className="text-[11.5px] text-text-muted">
              {risks.length} risks identified
            </p>
          </div>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          {Object.entries(riskCounts).map(([severity, count]) => {
            const config = severityConfig[severity];
            return (
              <div
                key={severity}
                className={`rounded-xl border ${config.borderColor} ${config.bg} p-3 text-center transition-transform hover:scale-[1.02]`}
              >
                <p className={`text-[20px] font-bold ${config.countText}`}>
                  {count}
                </p>
                <p className={`text-[11px] font-medium ${config.countText} opacity-70`}>
                  {severity}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Cards */}
      <div className="max-h-[420px] overflow-y-auto">
        <div className="p-3 pt-4 space-y-2">
          {sortedRisks.map((risk, index) => {
            const config = severityConfig[risk.severity];
            const Icon = config.icon;
            return (
              <div
                key={index}
                className={`rounded-xl border ${config.borderColor} p-4 hover:shadow-sm transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-4 h-4 ${config.iconColor}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={config.variant}>{risk.severity}</Badge>
                    </div>
                    <h4 className="text-[13px] font-semibold text-text mb-1">
                      {risk.risk_title}
                    </h4>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      {risk.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
