import TransactionCard from '../TransactionCard';
import { ShoppingBag } from 'lucide-react';

export default function TransactionCardExample() {
  return (
    <TransactionCard
      id="1"
      merchant="Amazon"
      amount={45.99}
      category="Shopping"
      categoryIcon={ShoppingBag}
      date={new Date()}
      paymentMethod="Credit Card"
    />
  );
}
