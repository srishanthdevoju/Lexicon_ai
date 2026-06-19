import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { completeProfile } from "@/lib/api";
import { Scale, Lock, AtSign, ArrowRight, HelpCircle, Globe, AlertCircle, UserPlus, Briefcase, Users, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/LanguageContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isAuthenticated, loading, profileComplete, updateUserRole, user } = useAuth();
  const { lang, setLang, t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("lawyer");
  const [fullName, setFullName] = useState("");
  
  // OTP signup verification states
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Google OAuth role selection states
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [roleSelectionRole, setRoleSelectionRole] = useState("client");
  const [roleSelectionName, setRoleSelectionName] = useState("");
  const [roleSelectionSubmitting, setRoleSelectionSubmitting] = useState(false);

  // Redirect if already authenticated AND profile is complete
  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (profileComplete) {
        navigate("/dashboard");
      } else {
        // Show role selection for Google OAuth users who haven't set up their profile
        setShowRoleSelection(true);
        setRoleSelectionName(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
      }
    }
  }, [isAuthenticated, loading, profileComplete, navigate, user]);

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google auth error:", err);
      setError(getErrorMessage(err));
    }
  };

  const getErrorMessage = (err) => {
    if (!err) return t("authFailed", "login") || "Authentication failed. Please try again.";
    if (typeof err === "string") return err;
    
    // Check nested errors first
    if (err.error && typeof err.error === "object") {
      if (err.error.message && typeof err.error.message === "string") return err.error.message;
      if (err.error.description && typeof err.error.description === "string") return err.error.description;
    }
    
    if (err.message && typeof err.message === "string" && err.message.trim()) return err.message;
    if (err.error_description && typeof err.error_description === "string") return err.error_description;
    if (err.msg && typeof err.msg === "string") return err.msg;
    
    // Convert native error or custom object to string
    const errString = err.toString ? err.toString() : "";
    if (errString && errString !== "[object Object]") {
      // Clean up common prefixes like "AuthApiError: " or "AuthRetryableFetchError: "
      return errString.replace(/^[A-Za-z]+Error:\s*/, "");
    }

    try {
      const str = JSON.stringify(err);
      if (str && str !== "{}" && str !== "[]") return str;
    } catch (_) {
      // Ignore serialization errors
    }

    return "Authentication failed. Please check your credentials and try again.";
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const metadata = {
          full_name: fullName.trim() ? fullName : email.split("@")[0],
          name: fullName.trim() ? fullName : email.split("@")[0],
          role: selectedRole
        };
        const data = await signUpWithEmail(email, password, metadata);
        if (data?.session) {
          navigate("/dashboard");
        } else {
          setShowOtpStep(true);
          setSuccessMessage("An OTP confirmation code has been sent to your email.");
        }
      } else {
        await signInWithEmail(email, password);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup"
      });
      if (otpError) throw otpError;
      navigate("/dashboard");
    } catch (err) {
      console.error("OTP error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelectionSubmit = async (e) => {
    e.preventDefault();
    if (!roleSelectionName.trim()) return;

    setRoleSelectionSubmitting(true);
    setError("");
    try {
      // 1. Update Supabase auth metadata
      await updateUserRole(roleSelectionRole, roleSelectionName.trim());

      // 2. Complete profile on backend (insert into lawyers/clients table)
      await completeProfile(roleSelectionName.trim(), roleSelectionRole);

      setShowRoleSelection(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Role selection error:", err);
      setError(getErrorMessage(err));
    } finally {
      setRoleSelectionSubmitting(false);
    }
  };

  // ─── Google OAuth Role Selection Screen ───────────────────────────
  if (showRoleSelection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans select-none antialiased py-12">
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-5 h-5 text-primary" strokeWidth={2.5} />
            <span className="font-bold text-lg tracking-tight uppercase text-primary">LexiconAI</span>
          </div>
          <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">{t("platform", "common")}</p>
        </div>

        <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-primary tracking-tight">{t("completeProfile", "login")}</h2>
              <p className="text-[13px] text-text-secondary">
                {t("profileWelcome", "login")}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRoleSelectionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("yourName", "login")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={t("enterFullName", "login")}
                    value={roleSelectionName}
                    onChange={(e) => setRoleSelectionName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("accountType", "login")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleSelectionRole("lawyer")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 border rounded text-[12px] font-medium transition-all ${
                      roleSelectionRole === "lawyer"
                        ? "border-primary bg-primary-100 text-primary"
                        : "border-border bg-white text-text-secondary hover:border-primary/40"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{t("lawyer", "login")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleSelectionRole("client")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 border rounded text-[12px] font-medium transition-all ${
                      roleSelectionRole === "client"
                        ? "border-primary bg-primary-100 text-primary"
                        : "border-border bg-white text-text-secondary hover:border-primary/40"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t("client", "login")}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={roleSelectionSubmitting || !roleSelectionName.trim()}
                className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white text-[13px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {roleSelectionSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t("settingUp", "login")}</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>{t("continueDashboard", "login")}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── OTP Verification Screen ──────────────────────────────────────
  if (showOtpStep) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans select-none antialiased py-12">
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-5 h-5 text-primary" strokeWidth={2.5} />
            <span className="font-bold text-lg tracking-tight uppercase text-primary">LexiconAI</span>
          </div>
          <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">{t("platform", "common")}</p>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-primary tracking-tight">{t("checkEmail", "login")}</h2>
              <p className="text-[13px] text-text-secondary">
                {t("sentLink", "login")} <span className="font-semibold">{email}</span>.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-[12.5px] text-primary leading-relaxed my-3">
                <strong>How to activate:</strong> {t("otpInstruction", "login")}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-risk-green-light border border-risk-green/15 rounded text-[12px] text-risk-green">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-4 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("otpLabel", "login")}
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="12345678"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.5em] font-mono text-lg py-2.5 border border-border rounded text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 6 || otpCode.length > 8}
                className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white text-[13px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t("verifyingCode", "login")}</span>
                  </>
                ) : (
                  <span>{t("verifyActivate", "login")}</span>
                )}
              </button>
            </form>

            <button
              onClick={() => {
                setShowOtpStep(false);
                setError("");
                setIsSignUp(false);
              }}
              className="w-full text-center text-xs text-text-secondary hover:text-primary transition-colors font-medium hover:underline"
            >
              {t("backSignIn", "login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Login / Sign Up Screen ──────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans select-none antialiased py-12">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Scale className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight uppercase text-primary">LexiconAI</span>
        </div>
        <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">{t("platform", "common")}</p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-primary tracking-tight">
              {isSignUp ? t("signupTitle", "login") : t("secureSignIn", "login")}
            </h2>
            <p className="text-[13px] text-text-secondary">
              {isSignUp
                ? t("registerWorkspace", "login")
                : t("accessWorkspace", "login")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-risk-green-light border border-risk-green/15 rounded text-[12px] text-risk-green">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Continue with Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-border rounded text-[13px] font-medium text-text-secondary hover:text-primary hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t("continueGoogle", "login")}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] text-text-muted font-bold tracking-wider uppercase bg-white px-2">
              {t("orUseEmail", "login")}
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("fullName", "login")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={t("enterFullName", "login")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                {t("email", "login")}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@firm-name.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("password", "login")}
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[11px] font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    {t("forgot", "login")}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                />
              </div>
            </div>

            {/* Role Selector (sign up only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  {t("accountType", "login")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("lawyer")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 border rounded text-[12px] font-medium transition-all ${
                      selectedRole === "lawyer"
                        ? "border-primary bg-primary-100 text-primary"
                        : "border-border bg-white text-text-secondary hover:border-primary/40"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{t("lawyer", "login")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("client")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 border rounded text-[12px] font-medium transition-all ${
                      selectedRole === "client"
                        ? "border-primary bg-primary-100 text-primary"
                        : "border-border bg-white text-text-secondary hover:border-primary/40"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t("client", "login")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me (sign in only) */}
            {!isSignUp && (
              <div className="flex items-center gap-2 py-1">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 focus:ring-1 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-text-secondary cursor-pointer select-none">
                  {t("rememberDevice", "login")}
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 text-white text-[13px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
                isSubmitting
                  ? "bg-primary/60 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-light"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t("settingUp", "login")}</span>
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{isSignUp ? t("signupBtn", "login") : t("signInWorkspace", "login")}</span>
                </>
              )}
            </button>
          </form>

          <hr className="border-border" />

          {/* Toggle sign up / sign in */}
          <p className="text-[12px] text-text-secondary text-center">
            {isSignUp ? t("haveAccount", "login") : t("noAccount", "login")}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccessMessage("");
              }}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? t("signinBtn", "login") : t("signupBtn", "login")}
            </button>
          </p>

          {/* Footer Card Notice */}
          <p className="text-[10px] text-text-muted text-center leading-relaxed">
            {t("authorizedNotice", "login")}{" "}
            <Link to="/terms" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              {t("termsOfService", "common")}
            </Link>{" "}
            {t("and", "login")}{" "}
            <Link to="/privacy" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              {t("privacyPolicy", "common")}
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Outer Card Links */}
      <div className="flex items-center gap-6 mt-6 text-xs text-text-secondary">
        <a href="#support" className="flex items-center gap-1 hover:text-primary transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t("supportCenter", "login")}</span>
        </a>
        <div className="flex items-center gap-1 hover:text-primary transition-colors">
          <Globe className="w-3.5 h-3.5 text-text-secondary" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer hover:text-primary transition-colors"
          >
            <option value="en">Language: English</option>
            <option value="te">భాష: తెలుగు</option>
            <option value="hi">भाषा: हिन्दी</option>
          </select>
        </div>
      </div>
    </div>
  );
}
