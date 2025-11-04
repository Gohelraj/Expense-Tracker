import StatCard from '../StatCard';
import { Wallet } from 'lucide-react';

export default function StatCardExample() {
  return (
    <StatCard
      title="This Month"
      value="1,234"
      icon={Wallet}
      trend={{ value: "12% from last month", isPositive: true }}
    />
  );
}
