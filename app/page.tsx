import Link from "next/link";
import { TrendingUp, Shield, BarChart3, Clock, CheckCircle, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure & Transparent",
    description: "Every deposit is verified by our team. You see every step — from submission to confirmation.",
  },
  {
    icon: BarChart3,
    title: "Track Your Growth",
    description: "Real-time dashboards show your active investments, expected interest, and maturity dates.",
  },
  {
    icon: Clock,
    title: "Flexible Periods",
    description: "Choose from Weekly, Monthly, 3 Months, 6 Months, 1 Year, or 5 Year investment horizons.",
  },
  {
    icon: CheckCircle,
    title: "Simple Process",
    description: "Deposit at any approved bank, upload your receipt, and we take care of the rest.",
  },
];

const banks = ["Bancobu", "BCB", "KCB", "Ecobank"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900">Investo</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-navy-700 px-5 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
          >
            Sign In <ArrowRight className="h-4 w-4" />
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
            Grow Your Wealth,
            <br />
            <span className="text-emerald-400">One Deposit at a Time</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            Investo makes investing simple and transparent. Deposit at your preferred bank,
            upload your receipt, and watch your money grow with competitive interest rates.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Investo?</h2>
            <p className="mt-3 text-gray-500">Designed for trust, built for growth.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 mb-4">
                    <Icon className="h-6 w-6 text-navy-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-14">How It Works</h2>
          <div className="space-y-8">
            {[
              { step: "01", title: "Create your account", desc: "Sign up and complete your investor profile." },
              { step: "02", title: "Deposit at your bank", desc: "Visit any of our approved partner banks and make your deposit." },
              { step: "03", title: "Submit your receipt", desc: "Upload your bank receipt through the Investo platform." },
              { step: "04", title: "Track your investment", desc: "Our team verifies the deposit and your investment starts earning." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6 text-left">
                <span className="flex-shrink-0 text-3xl font-black text-navy-100">{item.step}</span>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
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
            Approved Partner Banks
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
          © {new Date().getFullYear()} Investo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
