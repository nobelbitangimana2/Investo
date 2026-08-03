"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { mockLogin } from "@/lib/mock-api";
import { loginSchema, type LoginFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [quickRole, setQuickRole] = useState<string | null>(null);
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
        </div>
      </div>
    </div>
  );
}
