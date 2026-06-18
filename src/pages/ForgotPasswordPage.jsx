import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Scale, AtSign, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
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
        <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">Password Recovery</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
        <div className="space-y-6">
          {!sent ? (
            <>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-primary tracking-tight">Reset Your Password</h2>
                <p className="text-[13px] text-text-secondary">
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/15 rounded text-[12px] text-risk-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Reset Link</span>
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
                <h2 className="text-xl font-semibold text-primary tracking-tight">Check Your Email</h2>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  We've sent a password reset link to <strong className="text-primary">{email}</strong>. 
                  Click the link in the email to create a new password.
                </p>
              </div>
              <p className="text-[11px] text-text-muted">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => { setSent(false); setError(""); }}
                  className="font-semibold text-primary hover:underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          )}

          <hr className="border-border" />

          {/* Back to Login */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-1.5 text-[12px] text-text-secondary hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
