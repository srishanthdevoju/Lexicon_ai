import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { uploadMultipleDocuments } from "@/lib/api";
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Files
} from "lucide-react";

export default function DocumentSubmissionPage() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [enableRiskScoring, setEnableRiskScoring] = useState(true);
  const [clauseExtraction, setClauseExtraction] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const steps = [
    "Uploading batch to server...",
    "Extracting text from PDF batch...",
    "Running legal AI analysis agent...",
    "Classifying clauses...",
    "Checking cross-document inconsistencies...",
    "Finalizing reports..."
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files) => {
    setError("");
    const newPDFs = files.filter(file => {
      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      if (!isPDF) {
        setError("Only PDF files are accepted.");
        return false;
      }
      const isUnderLimit = file.size <= 50 * 1024 * 1024;
      if (!isUnderLimit) {
        setError(`File "${file.name}" exceeds the maximum size limit of 50 MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => {
      // Avoid duplicate filenames
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = newPDFs.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) return;
    setAnalyzing(true);
    setError("");
    setProgress(5);
    setStatusMessage(steps[0]);

    try {
      // Step 1: Batch upload
      setProgress(15);
      const results = await uploadMultipleDocuments(selectedFiles, (uploadPct) => {
        // Map upload progress (0-100) to our overall progress (15-50)
        const mapped = 15 + Math.round(uploadPct * 0.35);
        setProgress(mapped);
        if (uploadPct >= 100) {
          setStatusMessage(steps[1]);
        }
      });

      // Processing phase
      setProgress(60);
      setStatusMessage(steps[2]);

      await new Promise(r => setTimeout(r, 600));
      setProgress(75);
      setStatusMessage(steps[3]);

      await new Promise(r => setTimeout(r, 400));
      setProgress(85);
      setStatusMessage(steps[4]);

      await new Promise(r => setTimeout(r, 400));
      setProgress(95);
      setStatusMessage(steps[5]);

      await new Promise(r => setTimeout(r, 300));
      setProgress(100);
      setStatusMessage("Analysis complete!");

      // Smart navigation redirect:
      // If exactly 2 documents are uploaded, open side-by-side split comparison page immediately!
      // Otherwise, open the analysis of the first uploaded file.
      setTimeout(() => {
        if (results && results.length === 2) {
          navigate(`/split-view?docA=${results[0].document_id}&docB=${results[1].document_id}`);
        } else if (results && results.length > 0) {
          navigate(`/analysis/${results[0].document_id}`);
        } else {
          navigate("/dashboard");
        }
      }, 500);

    } catch (err) {
      console.error("Batch upload failed:", err);
      setAnalyzing(false);
      setProgress(0);
      const message = err.response?.data?.detail || err.message || "Batch analysis failed. Please try again.";
      setError(message);
    }
  };

  return (
    <Shell>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Multi-Document Submission</h1>
          <p className="text-[13px] text-text-secondary">
            Upload one or more PDF files for automated clause extraction, individual risk scoring, and mutual contradiction assessment.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-risk-red hover:text-risk-red/80">
              ✕
            </button>
          </div>
        )}

        {/* Upload Container */}
        <div className="bg-white border border-border rounded p-6 shadow-sm">
          {!analyzing ? (
            <div className="space-y-6">
              
              {/* File Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive 
                    ? "border-primary bg-primary-50/50" 
                    : "border-border bg-primary-50/10 hover:bg-primary-50/35"
                }`}
              >
                <div className="w-12 h-12 rounded bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-5 h-5 text-text-secondary" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-primary">Click to upload or drag and drop multiple files</p>
                  <p className="text-[11px] text-text-secondary">PDF files only (Max 50MB per file)</p>
                </div>
                
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 px-4 py-1.5 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                >
                  Select PDF Documents
                </label>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <Files className="w-3.5 h-3.5" />
                    <span>Selected Documents ({selectedFiles.length})</span>
                  </div>
                  <div className="border border-border rounded divide-y divide-border/60 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-slate-50/20 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-primary truncate">{file.name}</p>
                            <p className="text-[10px] text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-text-muted hover:text-risk-red transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options & Action strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRiskScoring}
                      onChange={(e) => setEnableRiskScoring(e.target.checked)}
                      className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Enable Risk Scoring</span>
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clauseExtraction}
                      onChange={(e) => setClauseExtraction(e.target.checked)}
                      className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <span>Clause Extraction</span>
                  </label>
                </div>
                
                <button
                  onClick={startAnalysis}
                  disabled={selectedFiles.length === 0}
                  className={`px-5 py-2 rounded text-[13px] font-medium transition-colors flex items-center gap-2 ${
                    selectedFiles.length > 0
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "bg-primary-100 text-text-secondary border border-border cursor-not-allowed"
                  }`}
                >
                  <span>Begin Batch Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* Analysis Progress state */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
              {progress < 100 ? (
                <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-risk-green-light flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-risk-green" />
                </div>
              )}
              <div className="space-y-2 w-full">
                <h3 className="font-semibold text-[14px] text-primary">
                  {progress >= 100 ? "Analysis Complete!" : "Analyzing Documents..."}
                </h3>
                <p className="text-[12px] text-text-secondary italic h-4">{statusMessage}</p>
                
                <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden mt-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 100 ? "bg-risk-green" : "bg-primary"
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-text-muted text-right font-medium">{progress}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
