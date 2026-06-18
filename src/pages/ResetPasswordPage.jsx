import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Scale, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect to login if no session (user needs to click the email link first)
  useEffect(() => {
    if (!session) {
      // Give time for Supabase to process the recovery token from the URL hash
      const timeout = setTimeout(() => {
        if (!session) {
          // Session may still be loading - don't redirect immediately
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [session]);

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-risk-red", textColor: "text-risk-red", width: "20%" };
    if (score <= 2) return { label: "Fair", color: "bg-risk-amber", textColor: "text-risk-amber", width: "40%" };
    if (score <= 3) return { label: "Good", color: "bg-risk-blue", textColor: "text-risk-blue", width: "65%" };
    return { label: "Strong", color: "bg-risk-green", textColor: "text-risk-green", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans select-none antialiased py-12">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Scale className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight uppercase text-primary">Lexicon AI</span>
        </div>
        <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">Set New Password</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
        <div className="space-y-6">
          {!success ? (
            <>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-primary tracking-tight">Create New Password</h2>
                <p className="text-[13px] text-text-secondary">
                  Choose a strong password to secure your legal workspace.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-text-muted hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                          style={{ width: strength.width }}
                        ></div>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${strength.textColor}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:ring-1 transition-all bg-white ${
                        confirmPassword && confirmPassword !== password
                          ? "border-risk-red focus:border-risk-red focus:ring-risk-red/20"
                          : confirmPassword && confirmPassword === password
                            ? "border-risk-green focus:border-risk-green focus:ring-risk-green/20"
                            : "border-border focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <span className="text-[10px] text-risk-red font-medium">Passwords do not match</span>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <span className="text-[10px] text-risk-green font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword}
                  className={`w-full py-2 px-4 text-white text-[13px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
                    isSubmitting || !password || !confirmPassword
                      ? "bg-primary/60 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-light"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-risk-green-light flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-risk-green" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-primary tracking-tight">Password Updated</h2>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Your password has been successfully changed. Redirecting to your workspace...
                </p>
              </div>
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
