"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { verifyEmail, resendVerificationEmail } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";

type State = "loading" | "success" | "expired" | "invalid" | "already-verified";

// ── Inner component uses useSearchParams — must be inside Suspense ──────────
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        if (res.message.toLowerCase().includes("already")) {
          setState("already-verified");
        } else {
          setState("success");
        }
      })
      .catch((err: Error) => {
        const msg = (err.message ?? "").toLowerCase();
        if (msg.includes("expired")) {
          setState("expired");
        } else {
          setState("invalid");
        }
      });
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendMsg(null);
    try {
      await resendVerificationEmail(email);
      setResendMsg("A new verification link has been sent to your email.");
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto" />
          <p className="text-white/70 text-sm">Verifying your email…</p>
        </div>
      </div>
    );
  }

  const configs = {
    success: {
      icon: <CheckCircle className="h-12 w-12 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Email verified!",
      subtitle: "Your email has been verified successfully. You can now sign in.",
    },
    "already-verified": {
      icon: <CheckCircle className="h-12 w-12 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Already verified",
      subtitle: "Your email is already verified. You can sign in.",
    },
    expired: {
      icon: <Clock className="h-12 w-12 text-amber-500" />,
      bg: "bg-amber-50",
      title: "Link expired",
      subtitle:
        "This verification link has expired (links are valid for 24 hours). Enter your email below to receive a new one.",
    },
    invalid: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      bg: "bg-red-50",
      title: "Invalid link",
      subtitle:
        "This verification link is invalid or has already been used.",
    },
  };

  const cfg = configs[state];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </Link>
          <p className="text-white/60 text-sm">Investo — Email Verification</p>
        </div>

        <div className="rounded-2xl bg-white shadow-2xl p-8 text-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${cfg.bg} mx-auto mb-5`}>
            {cfg.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{cfg.title}</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{cfg.subtitle}</p>

          {/* Expired: resend form */}
          {state === "expired" && (
            <div className="mb-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
              {resendMsg && (
                <p className={`text-sm ${resendMsg.includes("sent") ? "text-emerald-600" : "text-red-600"}`}>
                  {resendMsg}
                </p>
              )}
              <Button onClick={handleResend} disabled={!email || resending} loading={resending} className="w-full">
                Send New Verification Link
              </Button>
            </div>
          )}

          {(state === "success" || state === "already-verified") && (
            <Link href="/login">
              <Button className="w-full" size="lg">Sign In to Investo</Button>
            </Link>
          )}

          {state === "invalid" && (
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to Login</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full">Create New Account</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export wraps content in Suspense ────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
