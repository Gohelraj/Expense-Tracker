import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { format } from "date-fns";

interface TransactionCardProps {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  categoryIcon: LucideIcon;
  date: Date;
  paymentMethod?: string;
}

export default function TransactionCard({
  merchant,
  amount,
  category,
  categoryIcon: CategoryIcon,
  date,
  paymentMethod,
}: TransactionCardProps) {
  return (
    <Card className="p-3 sm:p-4 hover-elevate active-elevate-2">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium truncate">{merchant}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(date, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-base sm:text-lg font-mono font-bold">-₹{amount.toFixed(2)}</p>
          {paymentMethod && (
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{paymentMethod}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
