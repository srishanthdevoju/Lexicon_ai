import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scale, ArrowLeft, ShieldCheck, Lock, Database, UserCheck } from "lucide-react";

export default function SecurityPage() {
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
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Enterprise Grade Compliance</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Security Architecture</h1>
            <p className="text-[13px] text-text-secondary">System Specifications & Data Integrity Standards</p>
          </div>

          <div className="space-y-8 text-[14px] leading-relaxed text-text-secondary">
            <p>
              Lexicon AI is designed to meet the rigorous security requirements of top-tier legal operations and compliance groups. We isolate, encrypt, and secure data at every stage of the document analysis pipeline.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 border border-border rounded bg-primary-50/50 space-y-3">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-[15px] text-primary">Data Encryption</h3>
                <p className="text-[12px] text-text-secondary">
                  TLS 1.3 in transit, AES-256 key management at rest. Strict payload sanitization before analysis.
                </p>
              </div>
              <div className="p-5 border border-border rounded bg-primary-50/50 space-y-3">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-[15px] text-primary">Logical Isolation</h3>
                <p className="text-[12px] text-text-secondary">
                  Multi-tenant isolation ensures your contracts are never visible or queryable by other organizations.
                </p>
              </div>
              <div className="p-5 border border-border rounded bg-primary-50/50 space-y-3">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-[15px] text-primary">Identity Management</h3>
                <p className="text-[12px] text-text-secondary">
                  SSO, Google Sign-In, and strict role-based access control (RBAC) governing views and audits.
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">1. Network & Infrastructure Security</h2>
              <p>
                Our infrastructure is hosted within secure, audited Tier III cloud data centers.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Firewalls & Network Segregation:</strong> Services are isolated behind VPCs, with strict security group boundaries and managed API gateways.</li>
                <li><strong>DDoS Mitigation:</strong> Automated traffic filtering protects against distributed denial of service attempts and malicious request floods.</li>
                <li><strong>Vulnerability Auditing:</strong> Continuous automated system and package dependency scans are executed on all builds.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">2. Secure Document Analysis Pipeline</h2>
              <p>
                We do not use standard open web endpoints for document parsing or large language model inference.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Ephemeral Inference:</strong> Text extraction and clause mapping payloads are parsed in sandbox memory. Once analysis results are populated, temporary generation buffers are destroyed.</li>
                <li><strong>No Model Retention:</strong> We partner with enterprise LLM vendors guaranteeing zero data storage, zero caching of prompts, and zero training of downstream models.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">3. Compliance Certifications & Audits</h2>
              <p>
                Our operations align with global corporate compliance best practices. We perform annual external penetration testing to verify sandbox isolation, cookie rotation, SSO security, and server-side state enforcement.
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
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          <Link to="/security" className="hover:text-primary font-semibold text-primary">Security Architecture</Link>
        </div>
      </footer>
    </div>
  );
}
