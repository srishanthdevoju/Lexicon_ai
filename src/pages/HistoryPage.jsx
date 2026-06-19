import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { listAnalyses } from "@/lib/api";
import { 
  Clock, 
  FileText, 
  ArrowUpRight, 
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await listAnalyses({ limit: 50 });
        setAnalyses(result.analyses || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredAnalyses = analyses.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (a.filename || "").toLowerCase().includes(term) ||
           (a.document_type || "").toLowerCase().includes(term);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Analysis History</h1>
            <p className="text-[13px] text-text-secondary">
              Complete audit trail of all document analyses performed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary bg-white w-64"
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-primary-50/30 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            <span className="col-span-4">Document</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-1">Risk Score</span>
            <span className="col-span-1">Notes</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Date</span>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Clock className="w-8 h-8 text-text-muted mb-2" />
              <p className="text-[13px] text-text-secondary">
                {searchTerm 
                  ? "No documents match your search." 
                  : userRole === "client"
                    ? "No documents have been shared with you yet. Ask your lawyer to share documents via the analysis page."
                    : "No analysis history yet."}
              </p>
              {!searchTerm && userRole !== "client" && (
                <button
                  onClick={() => navigate("/upload")}
                  className="mt-3 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
                >
                  Upload a Document
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAnalyses.map((item, idx) => {
                const riskScore = parseFloat(item.risk_score) || 0;
                const statusColor = riskScore >= 6
                  ? "bg-risk-red-light text-risk-red border-risk-red/10"
                  : riskScore >= 3
                    ? "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                    : "bg-risk-green-light text-risk-green border-risk-green/10";

                return (
                  <div 
                    key={idx}
                    onClick={() => navigate(`/analysis/${item.document_id}`)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-primary-50 cursor-pointer transition-colors group"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[13px] font-medium text-primary truncate">{item.filename || "Untitled"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[12px] text-text-secondary">{item.document_type || "Unknown"}</span>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-[13px] font-semibold ${riskScore >= 6 ? "text-risk-red" : riskScore >= 3 ? "text-risk-amber" : "text-risk-green"}`}>
                        {riskScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[12px] text-text-secondary font-medium">
                        {item.notes_count || 0}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${statusColor}`}>
                        {item.status || "completed"}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary">{formatDate(item.created_at)}</span>
                      <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
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
