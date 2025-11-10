import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  amount: number;
  percentage: number;
  color: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function CategoryCard({
  name,
  icon: Icon,
  amount,
  percentage,
  color,
  isSelected,
  onClick,
}: CategoryCardProps) {
  return (
    <Card
      className={`p-3 sm:p-4 cursor-pointer hover-elevate active-elevate-2 ${isSelected ? 'ring-2 ring-primary' : ''
        }`}
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase()}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm sm:text-base font-mono font-bold">₹{amount.toFixed(0)}</p>
        </div>
      </div>
    </Card>
  );
}
