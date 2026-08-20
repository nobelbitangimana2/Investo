import Link from "next/link";
import { Shield, BarChart3, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { InvestoLogo } from "@/components/ui/investo-logo";

const banks = ["Bancobu", "BCB", "KCB", "Ecobank"];

export default async function LandingPage() {
  const t = await getTranslations("landing");

  const features = [
    {
      icon: Shield,
      titleKey: "feature1Title" as const,
      descKey: "feature1Desc" as const,
    },
    {
      icon: BarChart3,
      titleKey: "feature2Title" as const,
      descKey: "feature2Desc" as const,
    },
    {
      icon: Clock,
      titleKey: "feature3Title" as const,
      descKey: "feature3Desc" as const,
    },
    {
      icon: CheckCircle,
      titleKey: "feature4Title" as const,
      descKey: "feature4Desc" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <InvestoLogo size={32} textClassName="text-navy-900" />
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-navy-700 px-5 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
          >
            {t("signIn")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCA wIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 mb-6">
            Investment Management Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            {t("heroTitle")}
            <br />
            <span className="text-emerald-400">{t("heroSubtitle")}</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              {t("getStarted")}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {t("howItWorksTitle")}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">{t("featuresTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.titleKey} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 mb-4">
                    <Icon className="h-6 w-6 text-navy-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t(f.titleKey)}</h3>
                  <p className="text-sm text-gray-500">{t(f.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-14">{t("howItWorksTitle")}</h2>
          <div className="space-y-8">
            {([
              { step: "01", desc: t("step1") },
              { step: "02", desc: t("step2") },
              { step: "03", desc: t("step3") },
              { step: "04", desc: t("step4") },
            ]).map((item) => (
              <div key={item.step} className="flex items-start gap-6 text-left">
                <span className="flex-shrink-0 text-3xl font-black text-navy-100">{item.step}</span>
                <div>
                  <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banks */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
            {t("partnersTitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {banks.map((bank) => (
              <span key={bank} className="text-lg font-bold text-gray-400 hover:text-navy-700 transition-colors">
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-navy-950 text-center">
        <p className="text-sm text-white/40">
          © {new Date().getFullYear()} Investo. {t("rights")}
        </p>
      </footer>
    </div>
  );
}
