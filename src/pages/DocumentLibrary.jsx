import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { listAnalyses } from "@/lib/api";
import { 
  FileText, 
  Search, 
  Grid, 
  List, 
  ArrowUpRight,
  RefreshCw,
  Upload,
  Clock
} from "lucide-react";

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await listAnalyses({ limit: 100 });
        setAnalyses(result.analyses || []);
      } catch (err) {
        console.error("Failed to fetch library:", err);
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
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Document Library</h1>
            <p className="text-[13px] text-text-secondary">
              Browse and manage all analyzed legal documents.
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
            <div className="flex items-center border border-border rounded overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary-100 text-primary" : "bg-white text-text-secondary hover:text-primary"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary-100 text-primary" : "bg-white text-text-secondary hover:text-primary"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {userRole !== "client" && (
              <button
                onClick={() => navigate("/upload")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-24 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="bg-white border border-border rounded p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <FileText className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="font-semibold text-[15px] text-primary mb-1">
              {searchTerm ? "No documents found" : userRole === "client" ? "No shared documents" : "Your library is empty"}
            </h3>
            <p className="text-[13px] text-text-secondary max-w-md">
              {searchTerm 
                ? "Try a different search term."
                : userRole === "client"
                  ? "No documents have been shared with you yet. Ask your lawyer to share documents via the analysis page."
                  : "Upload your first document to start building your legal document library."}
            </p>
            {!searchTerm && userRole !== "client" && (
              <button
                onClick={() => navigate("/upload")}
                className="mt-4 px-5 py-2 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
              >
                Upload First Document
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAnalyses.map((item, idx) => {
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
                  className="bg-white border border-border rounded p-5 hover:shadow-md cursor-pointer transition-all hover:border-primary-light flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-9 h-9 rounded bg-primary-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[13px] text-primary leading-snug truncate">
                      {item.filename || "Untitled Document"}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-1">{item.document_type || "Unknown Type"}</p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <span className={`font-bold ${riskScore >= 6 ? "text-risk-red" : riskScore >= 3 ? "text-risk-amber" : "text-risk-green"}`}>
                      Score: {riskScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {filteredAnalyses.map((item, idx) => {
                const riskScore = parseFloat(item.risk_score) || 0;

                return (
                  <div
                    key={idx}
                    onClick={() => navigate(`/analysis/${item.document_id}`)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-primary-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <span className="text-[13px] font-medium text-primary">{item.filename || "Untitled"}</span>
                        <span className="text-[11px] text-text-secondary ml-3">{item.document_type || "Unknown"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-text-secondary">{formatDate(item.created_at)}</span>
                      <span className={`text-[12px] font-semibold ${riskScore >= 6 ? "text-risk-red" : riskScore >= 3 ? "text-risk-amber" : "text-risk-green"}`}>
                        {riskScore.toFixed(1)}/10
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary" />
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
