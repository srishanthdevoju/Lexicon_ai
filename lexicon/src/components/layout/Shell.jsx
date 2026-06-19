import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
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
  Plus
} from "lucide-react";

export default function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: docId } = useParams();
  const { user, signOut } = useAuth();

  const isDocActiveView = 
    location.pathname.startsWith("/analysis") || 
    location.pathname.startsWith("/clauses") || 
    location.pathname.startsWith("/risk-assessment") || 
    location.pathname.startsWith("/chat");

  const mockActiveDocName = "Project Alpha";
  const mockActiveDocVer = "v2.4 Final Revision";

  const mainNavLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Library", path: "/library" },
    { label: "History", path: "/history" }
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
          <button 
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
          >
            <Plus className="w-[15px] h-[15px]" />
            <span>New Analysis</span>
          </button>
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
                  <h4 className="font-semibold text-[14px] leading-tight truncate text-primary">{mockActiveDocName}</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">{mockActiveDocVer}</p>
                </div>
                
                <hr className="border-border" />
                
                <nav className="space-y-1">
                  <Link
                    to={`/analysis/${docId || '1'}`}
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
                    to={`/clauses/${docId || '1'}`}
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
                    to={`/risk-assessment/${docId || '1'}`}
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
                    to={`/chat/${docId || '1'}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                      location.pathname.startsWith("/chat")
                        ? "bg-primary-100 text-primary font-semibold"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>AI Assistant</span>
                  </Link>
                </nav>

                <div className="pt-2">
                  <button className="w-full py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors uppercase tracking-wider">
                    Request Review
                  </button>
                </div>
              </div>
            ) : (
              /* Global Context Navigation */
              <div className="space-y-6">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    Workspace
                  </div>
                  <h4 className="font-semibold text-[14px] mt-1 text-primary">Lexicon AI</h4>
                  <p className="text-[11px] text-text-secondary">Legal Intelligence Platform</p>
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
            <a href="#support" className="flex items-center gap-2.5 text-[13px] text-text-secondary hover:text-primary transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span>Support Center</span>
            </a>
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
                <a href="#privacy" className="hover:text-primary">Privacy Policy</a>
                <a href="#terms" className="hover:text-primary">Terms of Service</a>
                <a href="#security" className="hover:text-primary">Security Architecture</a>
              </div>
            </footer>
          </div>
        </main>

      </div>
    </div>
  );
}
