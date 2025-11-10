import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4 space-y-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-mono font-bold mt-0.5 sm:mt-1 truncate">₹{value}</p>
          {trend && (
            <p className={`text-xs mt-0.5 sm:mt-1 truncate ${trend.isPositive ? 'text-chart-2' : 'text-destructive'}`}>
              {trend.isPositive ? '↓' : '↑'} {trend.value}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
}
