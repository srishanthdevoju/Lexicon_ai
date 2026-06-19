import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, Shield, Zap, Search, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/LanguageContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t("feature1Title", "landing"),
      description: t("feature1Desc", "landing")
    },
    {
      icon: Zap,
      title: t("feature2Title", "landing"),
      description: t("feature2Desc", "landing")
    },
    {
      icon: Search,
      title: t("feature3Title", "landing"),
      description: t("feature3Desc", "landing")
    }
  ];

  return (
    <div className="min-h-screen bg-white text-primary flex flex-col font-sans select-none antialiased">
      {/* Landing Header */}
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" strokeWidth={2.2} />
          <span className="font-bold text-[15px] tracking-tight uppercase">Lexicon AI</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Global Language Selector Dropdown */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-2 py-1 bg-white border border-border rounded text-[11px] font-semibold text-text-secondary hover:border-primary focus:outline-none transition-all cursor-pointer shadow-xs mr-1"
            title="Choose Language / భాషను ఎంచుకోండి / भाषा चुनें"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
          </select>
          <button 
            onClick={() => navigate("/login")}
            className="text-[13px] font-medium text-text-secondary hover:text-primary transition-colors"
          >
            {t("signIn", "landing")}
          </button>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
          >
            {t("getStarted", "landing")}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary-100 text-primary border border-primary/10 text-[11px] font-semibold tracking-wider uppercase">
            {t("enterprisePrecision", "landing")}
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-primary">
            {t("title", "landing")}
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed max-w-lg">
            {t("subtitle", "landing")}
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button 
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors flex items-center gap-1.5"
            >
              <span>{t("getStarted", "landing")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* CSS Mock App Render to ensure crisp high-end SaaS feeling */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-white rounded-lg border border-border shadow-xl p-4 aspect-[4/3] overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            </div>
            <span className="text-[10px] text-text-muted font-medium bg-primary-100 px-3 py-0.5 rounded border border-border">
              lexicon-ai.com/workspace/project-alpha
            </span>
            <div className="w-8"></div>
          </div>
          
          {/* Mock Content Layout */}
          <div className="grid grid-cols-3 gap-3 pt-3 h-[calc(100%-35px)]">
            {/* Sidebar Mock */}
            <div className="border-r border-border pr-2 space-y-3">
              <div className="space-y-1">
                <div className="w-12 h-1.5 bg-text-muted rounded"></div>
                <div className="w-24 h-3 bg-primary rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-6 bg-primary-100 border border-border rounded flex items-center px-1.5 gap-1">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <div className="w-16 h-2 bg-primary rounded"></div>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-6 flex items-center px-1.5 gap-1">
                    <div className="w-3 h-3 bg-border rounded"></div>
                    <div className="w-20 h-1.5 bg-text-secondary rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Central Document Mock */}
            <div className="col-span-2 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-primary-50 p-2 border border-border rounded">
                  <div className="space-y-1">
                    <div className="w-24 h-3 bg-primary rounded"></div>
                    <div className="w-36 h-2 bg-text-secondary rounded"></div>
                  </div>
                  <div className="px-2 py-0.5 bg-risk-red-light border border-risk-red/10 rounded text-[9px] text-risk-red font-semibold">
                    HIGH RISK
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="w-full h-2 bg-border rounded"></div>
                  <div className="w-full h-2 bg-border rounded"></div>
                  <div className="w-[85%] h-2 bg-border rounded"></div>
                  <div className="w-full h-2 bg-primary-100 border-l-2 border-primary rounded-r px-1.5 py-0.5 flex items-center">
                    <div className="w-32 h-1 bg-primary rounded"></div>
                  </div>
                  <div className="w-[90%] h-2 bg-border rounded"></div>
                </div>
              </div>

              {/* Summary stat strip */}
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                <div className="p-2 border border-border rounded text-center">
                  <div className="text-[10px] text-text-secondary">Confidence</div>
                  <div className="text-[13px] font-semibold text-primary">98%</div>
                </div>
                <div className="p-2 border border-border rounded text-center bg-risk-amber-light/30 border-risk-amber/15">
                  <div className="text-[10px] text-risk-amber">Risk Score</div>
                  <div className="text-[13px] font-semibold text-risk-amber">4.2/10</div>
                </div>
                <div className="p-2 border border-border rounded text-center">
                  <div className="text-[10px] text-text-secondary">Anomalies</div>
                  <div className="text-[13px] font-semibold text-primary">07</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="py-20 px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-primary">
            {t("featuresTitle", "landing")}
          </h2>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {t("featuresSubtitle", "landing")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 border border-border rounded bg-white hover:shadow-sm transition-all duration-300 space-y-4">
                <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[15px] text-primary">{feature.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Corporate Callout CTA */}
      <section className="border-t border-border bg-primary text-white py-16 px-8 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            {t("ctaTitle", "landing")}
          </h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            {t("ctaSubtitle", "landing")}
          </p>
          <div>
            <button 
              onClick={() => navigate("/login")}
              className="px-6 py-2.5 bg-white text-primary text-[13px] font-semibold rounded hover:bg-primary-100 transition-colors"
            >
              {t("requestAccess", "landing")}
            </button>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="py-8 px-8 border-t border-border flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full text-[11px] text-text-secondary gap-4">
        <div>
          <span>© {new Date().getFullYear()} {t("rightsReserved", "common")}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-primary">{t("privacyPolicy", "common")}</Link>
          <Link to="/terms" className="hover:text-primary">{t("termsOfService", "common")}</Link>
          <Link to="/security" className="hover:text-primary">{t("securityArch", "common")}</Link>
        </div>
      </footer>
    </div>
  );
}
