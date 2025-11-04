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
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4 space-y-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-mono font-bold mt-1">₹{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-chart-2' : 'text-destructive'}`}>
              {trend.isPositive ? '↓' : '↑'} {trend.value}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
}
