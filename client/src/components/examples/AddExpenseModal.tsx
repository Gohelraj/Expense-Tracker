import { useState } from 'react';
import AddExpenseModal from '../AddExpenseModal';
import { Button } from '@/components/ui/button';

export default function AddExpenseModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Add Expense Modal</Button>
      <AddExpenseModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
