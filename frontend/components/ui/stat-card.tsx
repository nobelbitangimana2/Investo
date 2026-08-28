import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  /** Optional sub-label rendered below the value */
  description?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  description,
  className,
  iconClassName,
}: StatCardProps) {
  const tone = iconClassName?.match(/bg-(emerald|amber|purple|blue|red)-50/)?.[1] ?? "teal";
  const toneClass = {
    teal: "bg-gradient-to-br from-[#4a8f88] to-[#2f756f]",
    emerald: "bg-gradient-to-br from-[#31a878] to-[#24845f]",
    amber: "bg-gradient-to-br from-[#e4a11a] to-[#c77d08]",
    purple: "bg-gradient-to-br from-[#6842bd] to-[#4b2a9d]",
    blue: "bg-gradient-to-br from-[#1d5c8d] to-[#123d6b]",
    red: "bg-gradient-to-br from-[#cb5b4d] to-[#ad443c]",
  }[tone];

  return (
    <Card className={cn("border-0 text-white shadow-sm hover:shadow-md transition-shadow", toneClass, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/85">{title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            {description && (
              <p className="mt-0.5 text-xs text-white/70">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-emerald-200" : "text-red-200"
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-black/15",
              iconClassName
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
