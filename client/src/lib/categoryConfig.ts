import { Utensils, Car, ShoppingBag, Home, Zap, Heart, Smartphone, LucideIcon } from "lucide-react";

export const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  "Food": { icon: Utensils, color: "hsl(32, 95%, 44%)" },
  "Transport": { icon: Car, color: "hsl(217, 91%, 60%)" },
  "Shopping": { icon: ShoppingBag, color: "hsl(262, 83%, 58%)" },
  "Bills": { icon: Home, color: "hsl(142, 76%, 36%)" },
  "Utilities": { icon: Zap, color: "hsl(340, 82%, 52%)" },
  "Health": { icon: Heart, color: "hsl(0, 84%, 60%)" },
  "Entertainment": { icon: Smartphone, color: "hsl(262, 83%, 58%)" },
};

export const getCategoryIcon = (category: string): LucideIcon => {
  return CATEGORY_CONFIG[category]?.icon || ShoppingBag;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_CONFIG[category]?.color || "hsl(262, 83%, 58%)";
};

export const CATEGORY_NAMES = Object.keys(CATEGORY_CONFIG);
