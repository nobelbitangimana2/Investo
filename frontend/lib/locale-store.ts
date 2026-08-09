"use client";

/**
 * Simple locale management using a cookie so the server-side
 * next-intl config can read it via i18n.ts.
 * The cookie is set client-side and the page re-renders via router.refresh().
 */

export type Locale = "en" | "fr";

export function getLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return (match?.[1] as Locale) ?? "en";
}

export function setLocale(locale: Locale): void {
  // 1 year expiry
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
