import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Scale,
  FileText,
  Clock,
  Search,
  Settings,
  HelpCircle,
  Plus,
  ChevronRight,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analysisHistory } from "@/data/mockData";

export default function Sidebar({ collapsed = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Documents", path: "/dashboard" },
    { icon: Clock, label: "History", path: "/dashboard" },
    { icon: Search, label: "Search", path: "/dashboard" },
  ];

  const bottomItems = [
    { icon: Settings, label: "Settings", path: "/dashboard" },
    { icon: HelpCircle, label: "Help & Support", path: "/dashboard" },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-border flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-[272px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border/60 shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
          <Scale className="w-[18px] h-[18px] text-white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-[14px] font-bold text-text truncate leading-tight">
              LegalDoc AI
            </h2>
            <p className="text-[11px] text-text-muted truncate leading-tight">
              Document Analyzer
            </p>
          </div>
        )}
      </div>

      {/* New Analysis Button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => navigate("/dashboard")}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-xl transition-all duration-200 cursor-pointer",
            "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
            collapsed ? "justify-center h-10 w-10 mx-auto" : "px-4 h-10 text-[13px] font-medium"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          {!collapsed && <span>New Analysis</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <div className="mb-1">
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Menu
            </span>
          )}
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path && item.label === "Dashboard";
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl h-10 transition-all duration-150 cursor-pointer",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-primary-50 text-primary font-medium"
                  : "text-text-secondary hover:bg-gray-50 hover:text-text"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="text-[13px]">{item.label}</span>}
            </button>
          );
        })}

        {/* History Section */}
        {!collapsed && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Recent Analysis
              </span>
            </div>
            <div className="space-y-0.5">
              {analysisHistory.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigate("/results")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors duration-150 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-text truncate font-medium leading-tight">
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                      {doc.date}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-2 border-t border-border/60 space-y-0.5">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl h-9 transition-all duration-150 cursor-pointer",
              collapsed ? "justify-center px-0" : "px-3",
              "text-text-secondary hover:bg-gray-50 hover:text-text"
            )}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && <span className="text-[13px]">{item.label}</span>}
          </button>
        ))}

        {/* User */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl mt-2 pt-2 border-t border-border/40",
            collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-semibold shrink-0">
            SC
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-text truncate leading-tight">
                Sarah Chen
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight">
                Pro Plan
              </p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" onClick={() => navigate("/")}>
              <LogOut className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
