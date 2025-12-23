import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseRecorded?: () => void;
  editingExpense?: any;
}

const expenseCategories = [
  "Rent",
  "Utilities",
  "Salaries",
  "Supplies",
  "Marketing",
  "Transportation",
  "Maintenance",
  "Other",
];

const paymentMethods = ["Cash", "M-Pesa", "Bank Transfer", "Credit Card", "Cheque"];

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseRecorded,
  editingExpense,
}) => {
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    vendor: "",
    reference_number: "",
    recurring: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        category: editingExpense.category || "",
        amount: String(editingExpense.amount || ""),
        description: editingExpense.description || "",
        date: editingExpense.expense_date || new Date().toISOString().split("T")[0],
        payment_method: editingExpense.payment_method || "cash",
        vendor: editingExpense.vendor || "",
        reference_number: editingExpense.reference_number || "",
        recurring: editingExpense.is_recurring || false,
      });
    } else {
      resetForm();
    }
  }, [editingExpense]);

  const resetForm = () => {
    setFormData({
      category: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      vendor: "",
      reference_number: "",
      recurring: false,
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
        expense_date: formData.date,
        payment_method: formData.payment_method,
        vendor: formData.vendor,
        reference_number: formData.reference_number,
        is_recurring: formData.recurring
      };

      if (editingExpense) {
        // Update existing expense
        const { data, error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id)
          .select();
        
        if (error) throw error;
        
        toast({
          title: "Expense Updated",
          description: "Your expense has been successfully updated.",
        });
      } else {
        // Create new expense
        const { data, error } = await supabase
          .from("expenses")
          .insert(expenseData)
          .select();

        if (error) throw error;

        toast({
          title: "Expense Recorded",
          description: "Your expense has been successfully recorded.",
        });
      }

      // Reset form and close modal
      resetForm();
      onClose();
      onExpenseRecorded?.();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {editingExpense ? "Edit Expense" : "Record New Expense"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                Expense Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Amount (KSh) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Date and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method.toLowerCase()}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor and Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Vendor/Supplier</Label>
              <Input
                placeholder="Enter vendor name..."
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Invoice/Receipt number..."
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Add details about this expense..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[100px] bg-background"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Attach Receipt (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent transition-colors cursor-pointer">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
            </div>
          </div>

          {/* Recurring Expense */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.recurring}
              onChange={(e) => handleInputChange('recurring', e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
            />
            <div>
              <label htmlFor="recurring" className="text-sm font-medium text-foreground block">
                This is a recurring expense
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set up automatic recording for regular expenses like rent or subscriptions
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Saving..." : (editingExpense ? "Update Expense" : "Record Expense")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
