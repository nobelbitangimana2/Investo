"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getLocale, setLocale, type Locale } from "@/lib/locale-store";
import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");

  useEffect(() => {
    setCurrentLocale(getLocale());
  }, []);

  function toggleLocale() {
    const next: Locale = currentLocale === "en" ? "fr" : "en";
    setLocale(next);
    setCurrentLocale(next);
    // Trigger a full server re-render so next-intl picks up the new cookie
    router.refresh();
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300
                 transition-colors"
      aria-label={`Switch to ${currentLocale === "en" ? t("french") : t("english")}`}
      title={`Switch to ${currentLocale === "en" ? t("french") : t("english")}`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{currentLocale === "en" ? "FR" : "EN"}</span>
    </button>
  );
}
