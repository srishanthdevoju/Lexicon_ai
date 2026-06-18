import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getAnalysis } from "@/lib/api";
import { 
  Scale, 
  FileText, 
  AlertTriangle, 
  MessageSquare, 
  Activity, 
  Folder, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  User,
  Plus,
  Columns
} from "lucide-react";

export default function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: docId } = useParams();
  const { user, signOut, userRole } = useAuth();

  const [activeDocName, setActiveDocName] = useState("Loading document...");
  const [activeDocVer, setActiveDocVer] = useState("");

  useEffect(() => {
    if (docId) {
      getAnalysis(docId)
        .then(data => {
          setActiveDocName(data.filename || "Untitled Document");
          setActiveDocVer(data.metadata?.document_type || "NDA");
        })
        .catch(() => {
          setActiveDocName("Legal Contract");
          setActiveDocVer("");
        });
    }
  }, [docId]);

  const isDocActiveView = 
    location.pathname.startsWith("/analysis") || 
    location.pathname.startsWith("/clauses") || 
    location.pathname.startsWith("/risk-assessment") || 
    location.pathname.startsWith("/chat");

  const mainNavLinks = userRole === "client" ? [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Notes", path: "/notes" },
    { label: "Messages", path: "/messages" }
  ] : [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Library", path: "/library" },
    { label: "History", path: "/history" },
    { label: "Notes", path: "/notes" },
    { label: "Messages", path: "/messages" },
    { label: "Split Comparison", path: "/split-view" }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Extract display name from user metadata or email
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col font-sans select-none antialiased">
      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Scale className="w-[18px] h-[18px] text-primary" strokeWidth={2.2} />
            <span className="font-semibold text-[15px] tracking-tight uppercase">Lexicon AI</span>
          </Link>
          
          {/* Main Navigation */}
          <nav className="flex items-center h-14">
            {mainNavLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`h-full px-5 flex items-center text-[13px] font-medium transition-colors border-b-2 relative top-[1px] ${
                    isActive 
                      ? "border-primary text-primary font-semibold" 
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link 
            to="/settings" 
            className="flex items-center gap-2 px-3 py-1.5 rounded text-[13px] text-text-secondary hover:text-primary transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
              {userInitials}
            </div>
            <span className="hidden sm:inline">{displayName}</span>
          </Link>
          {userRole === "lawyer" && (
            <button 
              onClick={() => navigate("/upload")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
            >
              <Plus className="w-[15px] h-[15px]" />
              <span>New Analysis</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 pt-14 flex items-stretch">
        
        {/* Context-Sensitive Sidebar */}
        <aside className="w-64 bg-white border-r border-border fixed left-0 top-14 bottom-0 flex flex-col justify-between z-30">
          <div className="p-4 flex-1 overflow-y-auto">
            {isDocActiveView ? (
              /* Active Document Context Navigation */
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-text-muted mb-1 text-[11px] font-semibold uppercase tracking-wider">
                    <FileText className="w-[11px] h-[11px]" />
                    <span>Active Document</span>
                  </div>
                  <h4 className="font-semibold text-[14px] leading-tight truncate text-primary">{activeDocName}</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">{activeDocVer}</p>
                </div>
                
                <hr className="border-border" />
                
                <nav className="space-y-1">
                  <Link
                    to={`/analysis/${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/analysis")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Document Overview</span>
                  </Link>

                  <Link
                    to={`/clauses/${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/clauses")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Clause Analysis</span>
                  </Link>

                  <Link
                    to={`/risk-assessment/${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/risk-assessment")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Risk Assessment</span>
                  </Link>

                  <Link
                    to={`/chat/${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/chat")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>AI Assistant</span>
                  </Link>

                  <Link
                    to={`/messages/${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/messages")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Collaboration Chat</span>
                  </Link>

                  <Link
                    to={`/split-view?docA=${docId}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors hover:bg-primary-50 hover:text-primary ${
                      location.pathname.startsWith("/split-view") ? "bg-primary-100 text-primary font-semibold" : "text-text-secondary"
                    }`}
                  >
                    <Columns className="w-4 h-4" />
                    <span>Split Comparison</span>
                  </Link>
                </nav>
              </div>
            ) : (
              /* Global Context Navigation */
              <div className="space-y-6">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    Workspace
                  </div>
                  <h4 className="font-semibold text-[14px] mt-1 text-primary">Lexicon AI</h4>
                  <p className="text-[11px] text-text-secondary">{userRole === "client" ? "Client Portal" : "Legal Intelligence Platform"}</p>
                </div>

                <hr className="border-border" />

                <nav className="space-y-1">
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname === "/dashboard"
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Overview</span>
                  </Link>

                  {userRole === "lawyer" && (
                    <>
                      <Link
                        to="/library"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                          location.pathname === "/library"
                            ? "bg-primary-100 text-primary font-semibold"
                            : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                        }`}
                      >
                        <Folder className="w-4 h-4" />
                        <span>All Documents</span>
                      </Link>

                      <Link
                        to="/history"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                          location.pathname === "/history"
                            ? "bg-primary-100 text-primary font-semibold"
                            : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                        }`}
                      >
                        <History className="w-4 h-4" />
                        <span>Analysis History</span>
                      </Link>

                      <Link
                        to="/upload"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                          location.pathname === "/upload"
                            ? "bg-primary-100 text-primary font-semibold"
                            : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Document</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to="/notes"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname === "/notes"
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Notes</span>
                  </Link>

                  <Link
                    to="/messages"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname === "/messages"
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Messages</span>
                  </Link>

                  {userRole === "lawyer" && (
                    <Link
                      to="/split-view"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                        location.pathname === "/split-view"
                          ? "bg-primary-100 text-primary font-semibold"
                          : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                      }`}
                    >
                      <Columns className="w-4 h-4 text-blue-600" />
                      <span>Split Comparison</span>
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border bg-primary-50 space-y-3">
            <Link to="/settings" className="flex items-center gap-2.5 text-[13px] text-text-secondary hover:text-primary transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <hr className="border-border" />
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2.5 text-[13px] text-risk-red hover:text-risk-red font-medium transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 pl-64 overflow-x-hidden">
          <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col justify-between">
            <div className="page-transition">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
              <div>
                <span>© {new Date().getFullYear()} Lexicon AI Systems. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="cursor-pointer hover:text-primary">Privacy Policy</span>
                <span className="cursor-pointer hover:text-primary">Terms of Service</span>
                <span className="cursor-pointer hover:text-primary">Security Architecture</span>
              </div>
            </footer>
          </div>
        </main>

      </div>
    </div>
  );
}
