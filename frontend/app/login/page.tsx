"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { mockLogin, resendVerificationEmail } from "@/lib/mock-api";
import { loginSchema, type LoginFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [quickRole, setQuickRole] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  // Email-not-verified state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const demoAccounts = [
    { label: "Admin", email: "admin@investo.bi", password: "Admin@2024!", role: "admin" },
    { label: "Accountant (Full)", email: "grace@investo.bi", password: "Grace@2024!", role: "accountant" },
    { label: "Accountant (Limited)", email: "patrick@investo.bi", password: "Patrick@2024!", role: "accountant" },
    { label: "Client", email: "kevin@example.com", password: "Client@2024!", role: "client" },
  ];

  function fillDemo(email: string, password: string, role: string) {
    setValue("email", email);
    setValue("password", password);
    setQuickRole(role);
    setLoginError(null);
  }

  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    setUnverifiedEmail(null);
    setResendMsg(null);
    try {
      const user = await mockLogin(data.email, data.password);
      if (!user) {
        setLoginError("Invalid email or password. Check your credentials.");
        return;
      }
      login(user);
      const roleMap: Record<string, string> = {
        admin: "/admin/dashboard",
        accountant: "/accountant/dashboard",
        client: "/client/dashboard",
      };
      router.push(roleMap[user.role] ?? "/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Check for email-not-verified error code from backend
      try {
        const parsed = JSON.parse(message);
        if (parsed?.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(parsed.email ?? data.email);
          return;
        }
      } catch {
        // Not JSON — regular error
      }
      setLoginError(message || "Invalid email or password. Check your credentials.");
    }
  }

  async function handleResendFromLogin() {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMsg(null);
    try {
      await resendVerificationEmail(unverifiedEmail);
      setResendMsg("Verification email sent. Check your inbox.");
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-white/60">Sign in to your Investo account</p>
        </div>

        <div className="rounded-2xl bg-white shadow-2xl p-8">
          {/* Quick Demo Login */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password, acc.role)}
                  className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                    quickRole === acc.role && acc.email === (demoAccounts.find(d => d.role === quickRole)?.email)
                      ? "border-navy-600 bg-navy-50 text-navy-700"
                      : "border-gray-200 text-gray-600 hover:border-navy-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-semibold block">{acc.label}</span>
                  <span className="text-gray-400 truncate block">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or sign in manually</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password?.message}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-navy-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {unverifiedEmail && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-2">
                <p className="font-medium">Please verify your email before signing in.</p>
                <p className="text-amber-700 text-xs">
                  We sent a verification link to{" "}
                  <span className="font-semibold">{unverifiedEmail}</span>.
                </p>
                {resendMsg && (
                  <p className={`text-xs font-medium ${resendMsg.includes("sent") ? "text-emerald-700" : "text-red-600"}`}>
                    {resendMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendFromLogin}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline hover:text-amber-900 disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend Verification Email"}
                </button>
              </div>
            )}

            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Click a demo account to auto-fill credentials
          </p>
          <p className="mt-3 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-navy-700 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {!forgotSent ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Reset your password</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Enter your email address and we&apos;ll send you a reset link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotEmail) setForgotSent(true);
                    }}
                    className="flex-1 rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
                  >
                    Send Reset Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Check your email</h2>
                  <p className="text-sm text-gray-500">
                    If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(""); }}
                    className="mt-4 rounded-lg bg-navy-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
