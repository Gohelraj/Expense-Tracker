import CategoryCard from '../CategoryCard';
import { Utensils } from 'lucide-react';

export default function CategoryCardExample() {
  return (
    <CategoryCard
      name="Food & Dining"
      icon={Utensils}
      amount={342}
      percentage={28}
      color="hsl(32, 95%, 44%)"
    />
  );
}
