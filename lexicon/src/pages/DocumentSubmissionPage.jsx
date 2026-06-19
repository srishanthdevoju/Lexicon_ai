import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { uploadDocument } from "@/lib/api";
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function DocumentSubmissionPage() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [enableRiskScoring, setEnableRiskScoring] = useState(true);
  const [clauseExtraction, setClauseExtraction] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const steps = [
    "Uploading file...",
    "Extracting text from PDF...",
    "Running AI analysis...",
    "Classifying clauses...",
    "Scoring risk exposure...",
    "Generating final report..."
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setError("");
      } else {
        setError("Only PDF files are accepted.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        setError("");
      } else {
        setError("Only PDF files are accepted.");
      }
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError("");
    setProgress(5);
    setStatusMessage(steps[0]);

    try {
      // Step 1: Upload progress
      setProgress(10);
      setStatusMessage(steps[0]);

      const result = await uploadDocument(selectedFile, (uploadPct) => {
        // Map upload progress (0-100) to our overall progress (10-30)
        const mapped = 10 + Math.round(uploadPct * 0.2);
        setProgress(mapped);
        if (uploadPct >= 100) {
          setStatusMessage(steps[1]);
        }
      });

      // Upload complete — server is processing
      setProgress(50);
      setStatusMessage(steps[2]);

      // Brief delay to show progress
      await new Promise(r => setTimeout(r, 500));
      setProgress(70);
      setStatusMessage(steps[3]);

      await new Promise(r => setTimeout(r, 300));
      setProgress(85);
      setStatusMessage(steps[4]);

      await new Promise(r => setTimeout(r, 300));
      setProgress(95);
      setStatusMessage(steps[5]);

      await new Promise(r => setTimeout(r, 200));
      setProgress(100);
      setStatusMessage("Analysis complete!");

      // Navigate to the analysis page with the real document_id
      setTimeout(() => {
        navigate(`/analysis/${result.document_id}`);
      }, 500);
    } catch (err) {
      console.error("Upload failed:", err);
      setAnalyzing(false);
      setProgress(0);
      const message = err.response?.data?.detail || err.message || "Analysis failed. Please try again.";
      setError(message);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Document Submission</h1>
          <p className="text-[13px] text-text-secondary">
            Upload contract agreements, NDA templates, or corporate filings for instant AI risk assessment.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-risk-red hover:text-risk-red/80">
              <XCircle className="w-3.5 h-3.5" />
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
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-risk-green" />
                      <p className="text-[13px] font-semibold text-primary">{selectedFile.name}</p>
                    </div>
                    <p className="text-[11px] text-text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-primary">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-text-secondary">PDF files only (Max 50MB)</p>
                  </div>
                )}
                
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 px-4 py-1.5 bg-white border border-border rounded text-[12px] font-medium text-text-secondary hover:text-primary hover:border-primary cursor-pointer transition-colors shadow-xs"
                >
                  Choose File
                </label>
              </div>

              {/* Options & Action strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
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
                  disabled={!selectedFile}
                  className={`px-5 py-2 rounded text-[13px] font-medium transition-colors flex items-center gap-2 ${
                    selectedFile
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "bg-primary-100 text-text-secondary border border-border cursor-not-allowed"
                  }`}
                >
                  <span>Begin Analysis</span>
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
                  {progress >= 100 ? "Analysis Complete!" : "Analyzing Document..."}
                </h3>
                <p className="text-[12px] text-text-secondary italic h-4">{statusMessage}</p>
                {/* Progress bar container */}
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
