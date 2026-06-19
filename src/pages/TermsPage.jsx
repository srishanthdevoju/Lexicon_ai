import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scale, ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Terms of Service</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Terms of Service</h1>
            <p className="text-[13px] text-text-secondary">Last Updated: June 18, 2026</p>
          </div>

          <div className="space-y-6 text-[14px] leading-relaxed text-text-secondary">
            <p>
              Welcome to Lexicon AI. By accessing or using our document analysis platform, websites, and associated application programming interfaces (the "Service"), you agree to be bound by these Terms of Service ("Terms").
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">1. License & Access</h2>
              <p>
                Lexicon AI grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for corporate, legal, and operational document analysis. You are responsible for ensuring your login credentials remain secure and confidential.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">2. No Legal Advice Disclaimer</h2>
              <p className="border-l-2 border-risk-amber pl-4 py-1 bg-risk-amber-light/35 rounded-r text-[13.5px] italic text-primary">
                <strong>Disclaimer:</strong> Lexicon AI is an artificial intelligence productivity tool. The analysis, risk ratings, summaries, and extracted clauses provided by the platform are for informational and educational guidance only. They do not constitute formal legal advice, and using this service does not establish an attorney-client relationship. Always verify critical assessments with qualified legal professionals.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">3. Intellectual Property Rights</h2>
              <p>
                You retain all rights, title, and ownership in the documents, metadata, and communications you upload or input to the Service ("Client Content"). Lexicon AI owns all rights, title, and interest in and to the platform code, database schemas, styling elements, and proprietary AI parsing pipelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">4. Acceptable Use Policies</h2>
              <p>
                You agree not to use the platform to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Upload documents containing malicious code, viruses, or illegal materials.</li>
                <li>Decompile, reverse-engineer, or attempt to extract the underlying source code or data models of Lexicon AI.</li>
                <li>Exceed the API or service limits of your subscription workspace tier.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">5. Warranties & Limitation of Liability</h2>
              <p>
                The Service is provided "as is" and "as available," without warranty of any kind, either express or implied. To the maximum extent permitted by law, Lexicon AI shall not be liable for any indirect, incidental, or consequential damages resulting from any errors, omissions, or inaccuracies in the AI analysis outputs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">6. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware.
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
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary font-semibold text-primary">Terms of Service</Link>
          <Link to="/security" className="hover:text-primary">Security Architecture</Link>
        </div>
      </footer>
    </div>
  );
}
