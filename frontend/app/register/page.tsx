"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff, CheckCircle, Mail, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { registerUser, resendVerificationEmail } from "@/lib/mock-api";
import { registerSchema, type RegisterFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string, t: (key: string) => string) {
  const checks = [
    { label: t("check8chars"), passed: password.length >= 8 },
    { label: t("checkUppercase"), passed: /[A-Z]/.test(password) },
    { label: t("checkLowercase"), passed: /[a-z]/.test(password) },
    { label: t("checkNumber"), passed: /\d/.test(password) },
    { label: t("checkSpecial"), passed: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.passed).length;
  const levels = [
    { label: t("strengthVeryWeak"), color: "bg-red-500" },
    { label: t("strengthWeak"), color: "bg-orange-500" },
    { label: t("strengthFair"), color: "bg-yellow-500" },
    { label: t("strengthGood"), color: "bg-blue-500" },
    { label: t("strengthStrong"), color: "bg-emerald-500" },
  ];
  return { score, ...levels[score], checks };
}

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: "onChange" });

  const password = watch("password") ?? "";
  const strength = getPasswordStrength(password, t);

  async function onSubmit(data: RegisterFormValues) {
    setServerError(null);
    try {
      await registerUser({ firstName: data.firstName, middleName: data.middleName, lastName: data.lastName, email: data.email, password: data.password });
      setRegisteredEmail(data.email);
      setRegistered(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleResend() {
    setResending(true); setResendMessage(null);
    try {
      await resendVerificationEmail(registeredEmail);
      setResendMessage(t("successResend"));
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    } finally { setResending(false); }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("accountCreated")}</h2>
            <p className="text-gray-500 mb-1">{t("accountCreatedMessage")}</p>
            <p className="text-gray-500 mb-6">
              {t("checkEmailVerify")}{" "}<span className="font-semibold text-gray-800">{registeredEmail}</span>{" "}{t("toVerify")}
            </p>
            {resendMessage && (
              <div className={cn("rounded-lg px-4 py-3 text-sm mb-4",
                resendMessage.includes("sent") || resendMessage.includes("envoyé")
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-700")}>
                {resendMessage}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <a href={`mailto:${registeredEmail}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition-colors">
                <Mail className="h-4 w-4" />{t("openEmailApp")}
              </a>
              <button type="button" onClick={handleResend} disabled={resending}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw className={cn("h-4 w-4", resending && "animate-spin")} />
                {resending ? "…" : t("resendEmail")}
              </button>
              <button type="button" onClick={() => { setRegistered(false); setRegisteredEmail(""); setResendMessage(null); }}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline">{t("changEmail")}</button>
            </div>
            <p className="mt-6 text-center text-sm text-gray-400">
              {t("alreadyVerified")}{" "}
              <Link href="/login" className="font-semibold text-navy-700 hover:underline">{t("signIn")}</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-white shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label={`${t("firstName")} *`} placeholder={t("firstNamePlaceholder")}
                autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
              <Input label={t("middleName")} placeholder={t("middleNamePlaceholder")}
                autoComplete="additional-name" error={errors.middleName?.message} {...register("middleName")} />
              <Input label={`${t("lastName")} *`} placeholder={t("lastNamePlaceholder")}
                autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
            </div>

            <Input label={`${t("emailAddress")} *`} type="email" placeholder="you@example.com"
              autoComplete="email" error={errors.email?.message} {...register("email")} />

            <div className="space-y-2">
              <div className="relative">
                <Input label={`${t("password")} *`} type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")} autoComplete="new-password"
                  error={errors.password?.message} className="pr-10" {...register("password")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < strength.score ? strength.color : "bg-gray-200")} />
                    ))}
                  </div>
                  <p className={cn("text-xs font-medium", { "text-red-600": strength.score <= 1, "text-yellow-600": strength.score === 2, "text-blue-600": strength.score === 3, "text-emerald-600": strength.score >= 4 })}>
                    {strength.label}
                  </p>
                  <ul className="grid grid-cols-1 gap-0.5">
                    {strength.checks.map((c) => (
                      <li key={c.label} className={cn("text-xs flex items-center gap-1.5", c.passed ? "text-emerald-600" : "text-gray-400")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", c.passed ? "bg-emerald-500" : "bg-gray-300")} />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative">
              <Input label={`${t("confirmPassword")} *`} type={showConfirm ? "text" : "password"}
                placeholder={t("confirmPasswordPlaceholder")} autoComplete="new-password"
                error={errors.confirmPassword?.message} className="pr-10" {...register("confirmPassword")} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>{t("createAccount")}</Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-navy-700 hover:underline">{t("signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
