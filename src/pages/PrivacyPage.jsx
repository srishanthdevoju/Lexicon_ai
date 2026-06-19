import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scale, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-50 text-primary flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" strokeWidth={2.2} />
          <span className="font-bold text-[15px] tracking-tight uppercase">Lexicon AI</span>
        </Link>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary hover:text-primary hover:border-primary text-[13px] font-medium rounded transition-colors bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-12 px-6">
        <div className="bg-white border border-border rounded-lg shadow-sm p-8 md:p-12 space-y-8">
          <div className="border-b border-border pb-6 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-[13px] uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Security & Compliance</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Privacy Policy</h1>
            <p className="text-[13px] text-text-secondary">Last Updated: June 18, 2026</p>
          </div>

          <div className="space-y-6 text-[14px] leading-relaxed text-text-secondary">
            <p>
              At Lexicon AI, we are committed to protecting the privacy and confidentiality of the legal documents and personal data you entrust to us. This Privacy Policy explains how we collect, process, and protect your information when using our AI-powered document analysis platform.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">1. Information We Collect</h2>
              <p>
                We collect information necessary to provide and optimize our services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account Information:</strong> Name, email address, corporate role, and credentials when you register or configure SSO.</li>
                <li><strong>Uploaded Documents:</strong> Legal contracts, agreements, and text files uploaded for AI analysis, risk scoring, or clause extraction.</li>
                <li><strong>Usage Metadata:</strong> Activity logs, analysis history, notes, collaboration comments, and system performance telemetry.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">2. How We Process and Use Your Information</h2>
              <p>
                Your data is processed solely for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To perform semantic parsing, clause identification, and risk evaluation.</li>
                <li>To maintain your secure, organized document library and analysis history.</li>
                <li>To enable team collaboration features, commenting, and notes.</li>
                <li>To monitor system health, verify security integrity, and resolve technical issues.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">3. Zero Data Training Policy</h2>
              <p className="border-l-2 border-primary pl-4 py-1 bg-primary-50 rounded-r text-[13.5px] italic text-primary">
                <strong>Important:</strong> Lexicon AI does not use your uploaded legal documents or proprietary contract text to train public foundation models or shared artificial intelligence systems. All LLM inferences are executed on isolated enterprise API endpoints.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">4. Data Security & Storage</h2>
              <p>
                We implement industry-leading security practices to safeguard legal materials:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All documents are encrypted in transit using TLS 1.3 and at rest using AES-256.</li>
                <li>Tenant data is completely isolated logically to prevent cross-account exposure.</li>
                <li>Uploaded files are automatically scanned for malware and processed in secure sandboxed runtimes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">5. Retaining and Deleting Data</h2>
              <p>
                You maintain complete ownership of your data. You may delete your uploaded documents, analysis history, or entire workspace account at any time through the Settings panel. Deleted files are immediately purged from our active systems and removed from backups within 30 days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">6. Contact Information</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your data protection rights, please contact our Compliance Officer at <a href="mailto:compliance@lexicon-ai.com" className="text-primary hover:underline font-medium">compliance@lexicon-ai.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-border bg-white flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full text-[11px] text-text-secondary gap-4">
        <div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-primary font-semibold text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          <Link to="/security" className="hover:text-primary">Security Architecture</Link>
        </div>
      </footer>
    </div>
  );
}
