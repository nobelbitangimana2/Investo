import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { InvestmentPeriod } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("fr-BI")} BIF`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function getInterestRateForPeriod(
  period: InvestmentPeriod,
  rates: { investmentPeriod: string; ratePercentage: number }[]
): number {
  return rates.find((r) => r.investmentPeriod === period)?.ratePercentage ?? 0;
}

export function calculateExpectedInterest(amount: number, ratePercentage: number): number {
  return Math.round((amount * ratePercentage) / 100);
}

export function getPeriodLabel(period: InvestmentPeriod): string {
  return period;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
