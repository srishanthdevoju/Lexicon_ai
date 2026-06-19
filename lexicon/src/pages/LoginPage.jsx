import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Scale, Lock, AtSign, ArrowRight, HelpCircle, Globe, AlertCircle, UserPlus } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, { full_name: email.split("@")[0] });
        setSuccessMessage("Check your email to confirm your account before signing in.");
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
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
        <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">Legal Intelligence & Analysis</p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-primary tracking-tight">
              {isSignUp ? "Create Account" : "Secure Sign In"}
            </h2>
            <p className="text-[13px] text-text-secondary">
              {isSignUp
                ? "Register for a new legal workspace account."
                : "Access your legal workspace and analysis history."}
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
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] text-text-muted font-bold tracking-wider uppercase bg-white px-2">
              Or use email
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Email Address
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
                  Password
                </label>
                {!isSignUp && (
                  <a
                    href="#forgot"
                    className="text-[11px] font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    Forgot?
                  </a>
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

            {/* Remember Me (sign in only) */}
            {!isSignUp && (
              <div className="flex items-center gap-2 py-1">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 focus:ring-1 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-text-secondary cursor-pointer select-none">
                  Remember this device for 30 days
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
                  <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{isSignUp ? "Create Account" : "Sign In to Workspace"}</span>
                </>
              )}
            </button>
          </form>

          <hr className="border-border" />

          {/* Toggle sign up / sign in */}
          <p className="text-[12px] text-text-secondary text-center">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccessMessage("");
              }}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          {/* Footer Card Notice */}
          <p className="text-[10px] text-text-muted text-center leading-relaxed">
            Authorized personnel only. Use of this system is subject to the{" "}
            <a href="#terms" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              Data Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Outer Card Links */}
      <div className="flex items-center gap-6 mt-6 text-xs text-text-secondary">
        <a href="#support" className="flex items-center gap-1 hover:text-primary transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support Center</span>
        </a>
        <a href="#lang" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Globe className="w-3.5 h-3.5" />
          <span>Language: EN-US</span>
        </a>
      </div>
    </div>
  );
}
