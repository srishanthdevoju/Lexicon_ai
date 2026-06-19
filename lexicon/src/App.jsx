import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import DocumentSubmissionPage from "@/pages/DocumentSubmissionPage";
import DocumentLibrary from "@/pages/DocumentLibrary";
import DocumentAnalysisPage from "@/pages/DocumentAnalysisPage";
import ClauseExtractionPage from "@/pages/ClauseExtractionPage";
import RiskAssessmentPage from "@/pages/RiskAssessmentPage";
import LegalAIChatbot from "@/pages/LegalAIChatbot";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] text-text-secondary font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><DocumentSubmissionPage /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><DocumentLibrary /></ProtectedRoute>} />
          <Route path="/analysis/:id" element={<ProtectedRoute><DocumentAnalysisPage /></ProtectedRoute>} />
          <Route path="/clauses/:id" element={<ProtectedRoute><ClauseExtractionPage /></ProtectedRoute>} />
          <Route path="/risk-assessment/:id" element={<ProtectedRoute><RiskAssessmentPage /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><LegalAIChatbot /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
