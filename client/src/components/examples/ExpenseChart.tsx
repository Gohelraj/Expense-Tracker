import ExpenseChart from '../ExpenseChart';

export default function ExpenseChartExample() {
  const mockData = [
    { name: 'Food', value: 342, color: 'hsl(32, 95%, 44%)' },
    { name: 'Transport', value: 156, color: 'hsl(217, 91%, 60%)' },
    { name: 'Shopping', value: 289, color: 'hsl(262, 83%, 58%)' },
    { name: 'Bills', value: 412, color: 'hsl(142, 76%, 36%)' },
  ];

  return <ExpenseChart data={mockData} />;
}
