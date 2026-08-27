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
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-navy-800 dark:text-navy-300">{title}</p>
              <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-300">{value}</p>
            {description && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-900/70",
              iconClassName
            )}
          >
            <Icon className="h-6 w-6 text-navy-700 dark:text-navy-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
