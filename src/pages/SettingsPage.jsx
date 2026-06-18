import React, { useState } from "react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Save
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
    role: "Legal Analyst",
    firm: "Lexicon AI Workspace",
    email: user?.email || "user@example.com"
  });

  const apiToken = "lex_live_" + (user?.id?.replace(/-/g, "").substring(0, 32) || "demo_token");

  const handleCopy = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert("Configuration changes saved successfully.");
  };

  return (
    <Shell>
      <div className="space-y-8 max-w-4xl">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">System Settings</h1>
          <p className="text-[13px] text-text-secondary">
            Manage your legal workspace credentials, system alerts, and developer access keys.
          </p>
        </div>

        {/* Sections Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* User Profile */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-[14px] text-primary">User Profile</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Position</label>
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile({...profile, role: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Organization</label>
                <input
                  type="text"
                  value={profile.firm}
                  onChange={(e) => setProfile({...profile, firm: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-text-secondary bg-primary-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Security Config */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-[14px] text-primary">Security Settings</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-[13px] text-primary">Authentication Provider</h4>
                  <p className="text-text-secondary text-[11px]">
                    {user?.app_metadata?.provider === "google" ? "Signed in via Google OAuth" : "Signed in via Email/Password"}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-risk-green-light text-risk-green text-[10px] font-bold border border-risk-green/10 rounded uppercase tracking-wider">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-[13px] text-primary">User ID</h4>
                  <p className="text-text-secondary text-[11px] font-mono">{user?.id || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Alert Rules */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-[14px] text-primary">Alert Rules & Notifications</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 mt-0.5 text-primary border-border rounded focus:ring-primary/20"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[13px] text-primary block leading-tight">Critical Exposure Warnings</span>
                  <span className="text-text-secondary text-[11px] block">Send instant notifications when high-severity risks are detected.</span>
                </div>
              </label>

              <hr className="border-border/60" />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 mt-0.5 text-primary border-border rounded focus:ring-primary/20"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[13px] text-primary block leading-tight">Weekly Compliance Summary</span>
                  <span className="text-text-secondary text-[11px] block">Receive weekly reports of all documents analyzed and risk scores.</span>
                </div>
              </label>
            </div>
          </div>

          {/* API Developer Key Configuration */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-[14px] text-primary">Developer API Integration</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <div className="space-y-2">
                <h4 className="font-semibold text-[13px] text-primary">API Access Token</h4>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Use this token to query Lexicon AI contract extraction endpoints programmatically.
                </p>
                
                <div className="flex items-center gap-2 pt-2">
                  <div className="relative flex-grow">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiToken}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded text-[13px] text-text-secondary font-mono bg-primary-50/40 select-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-text-secondary hover:text-primary transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2.5 border border-border rounded hover:border-primary hover:text-primary transition-colors bg-white flex items-center justify-center"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-risk-green" /> : <Copy className="w-4 h-4 text-text-secondary" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Configuration Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>

        </form>
      </div>
    </Shell>
  );
}
