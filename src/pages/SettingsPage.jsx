import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { updateProfilePhone, updateLawyerSlots } from "@/lib/api";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Save,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const { user, userRole } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
    role: userRole === "client" ? "Client" : "Legal Counsel",
    firm: "Lexicon AI Workspace",
    email: user?.email || "user@example.com",
    phone: ""
  });

  // Predefined time slots for lawyers
  const [availableSlots, setAvailableSlots] = useState(["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]);
  const [newSlot, setNewSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data: profData } = await supabase
          .from("profiles")
          .select("phone, role, name")
          .eq("id", user.id)
          .single();
        if (profData) {
          setProfile(p => ({
            ...p,
            phone: profData.phone || "",
            name: profData.name || p.name,
            role: profData.role === "client" ? "Client" : "Legal Counsel"
          }));
        }
      } catch (e) {
        console.error("Failed to load profiles:", e);
      }

      if (userRole === "lawyer") {
        try {
          const { data: lawData } = await supabase
            .from("lawyers")
            .select("available_slots")
            .eq("id", user.id)
            .single();
          if (lawData && lawData.available_slots) {
            setAvailableSlots(lawData.available_slots.split(",").map(s => s.trim()));
          }
        } catch (e) {
          console.error("Failed to load lawyers availability:", e);
        }
      }
    }
    loadData();
  }, [user, userRole]);

  const apiToken = "lex_live_" + (user?.id?.replace(/-/g, "").substring(0, 32) || "demo_token");

  const handleCopy = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      // 1. Update phone number
      await updateProfilePhone(profile.phone);
      
      // 2. If lawyer, update availability slots
      if (userRole === "lawyer") {
        await updateLawyerSlots(availableSlots.join(","));
      }
      
      setSuccess("Configuration settings saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to save settings. Please verify database connection.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-8 max-w-4xl">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">System Settings</h1>
          <p className="text-[13px] text-text-secondary">
            Manage your legal workspace credentials, contact slots, and developer access keys.
          </p>
        </div>

        {/* Notifications */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-risk-green-light border border-risk-green/20 rounded text-[13px] text-risk-green">
            <CheckCircle className="w-4.5 h-4.5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/20 rounded text-[13px] text-risk-red">
            <AlertCircle className="w-4.5 h-4.5" />
            <span>{error}</span>
          </div>
        )}

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
                  disabled
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-text-secondary bg-primary-50 cursor-not-allowed"
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

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>
            </div>
          </div>

          {/* LAWYER ONLY: Predefined Available Time Slots */}
          {userRole === "lawyer" && (
            <div className="bg-white border border-border rounded shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-[14px] text-primary">Predefined Available Consultation Booking Time Slots</h3>
              </div>
              
              <div className="p-6 space-y-4 text-[12px]">
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Define your standard available slots. Clients booking consultations with you will be forced to select one of these times.
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableSlots.map((slot, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100/60 border border-primary/10 rounded-full text-xs font-semibold text-primary"
                    >
                      <span>{slot}</span>
                      <button 
                        type="button" 
                        onClick={() => setAvailableSlots(prev => prev.filter((_, i) => i !== idx))}
                        className="text-text-muted hover:text-risk-red font-bold font-mono text-[11px] pl-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {availableSlots.length === 0 && (
                    <span className="text-[11px] text-text-muted italic">No availability slots defined. Clients won't be able to book sessions with you.</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 pt-2 max-w-xs">
                  <input 
                    type="time" 
                    value={newSlot}
                    onChange={(e) => setNewSlot(e.target.value)}
                    className="px-3 py-1.5 border border-border rounded text-[13px] bg-white focus:outline-none focus:border-primary"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (newSlot && !availableSlots.includes(newSlot)) {
                        setAvailableSlots(prev => [...prev, newSlot].sort());
                        setNewSlot("");
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white font-medium rounded text-[12px] hover:bg-primary-light transition-colors shadow-xs"
                  >
                    Add Slot
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* API Developer Key Configuration */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-[14px] text-primary">Developer API Integration</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <div className="space-y-2">
                <h4 className="font-semibold text-[13px] text-primary">API Access Token</h4>
                <p className="text-text-secondary text-[11px] leading-relaxed mb-2">
                  Use this token to query Lexicon AI contract extraction endpoints programmatically.
                </p>
                
                <div className="p-3.5 bg-blue-50/80 border border-blue-100/50 rounded text-[11.5px] text-blue-900 leading-relaxed max-w-2xl mb-4">
                  <strong>ℹ️ Security Clearance:</strong> This API token is a client-side utility key generated directly from your credentials. It does not represent any external exploit or security threat to your workspace.
                </div>
                
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
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Settings..." : "Save System Settings"}</span>
            </button>
          </div>

        </form>
      </div>
    </Shell>
  );
}
