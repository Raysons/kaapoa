import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt, Trash2, Edit, Search, Filter, TrendingDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ExpenseModal from "@/components/modals/ExpenseModal";

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

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExpenses(data || []);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleExpenseModalClose = () => {
    setExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
      });

      // Refresh expenses list
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate expense metrics
  const expenseMetrics = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const thisMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const todayExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.toDateString() === today.toDateString();
    });

    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
    const monthExpenses = thisMonthExpenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
    const todayTotal = todayExpenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc: any, expense: any) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    return {
      total: totalExpenses,
      thisMonth: monthExpenses,
      today: todayTotal,
      categoryBreakdown,
      count: expenses.length
    };
  }, [expenses]);

  // Filter expenses based on search and filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: any) => {
      const matchesSearch = !searchTerm || 
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || expense.category === filterCategory;
      
      const matchesMonth = filterMonth === "all" || (() => {
        if (filterMonth === "current") {
          const expenseDate = new Date(expense.expense_date);
          const today = new Date();
          return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
        }
        return true;
      })();

      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [expenses, searchTerm, filterCategory, filterMonth]);

  return (
    <DashboardLayout title="Expenses">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground mt-1">Record & Track Expenses</p>
        </div>

        {/* Expense Metrics */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
              <h3 className="text-2xl font-bold text-destructive">KSH {expenseMetrics.total.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">This Month</p>
              <h3 className="text-2xl font-bold text-warning">KSH {expenseMetrics.thisMonth.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Today</p>
              <h3 className="text-2xl font-bold text-info">KSH {expenseMetrics.today.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Count</p>
              <h3 className="text-2xl font-bold text-accent">{expenseMetrics.count}</h3>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Filter by month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="current">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Expenses List */}
        <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          {loading ? (
            <p>Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <p>No expenses found matching your criteria.</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2 text-left">Category</th>
                  <th className="border-b p-2 text-left">Amount</th>
                  <th className="border-b p-2 text-left">Description</th>
                  <th className="border-b p-2 text-left">Date</th>
                  <th className="border-b p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted">
                    <td className="border-b p-2">{expense.category}</td>
                    <td className="border-b p-2">KSH {Number(expense.amount || 0).toLocaleString()}</td>
                    <td className="border-b p-2">{expense.description || "-"}</td>
                    <td className="border-b p-2">{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td className="border-b p-2 space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Expense Button */}
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <Button 
            onClick={() => setExpenseModalOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record New Expense
          </Button>
        </div>

        <ExpenseModal
          isOpen={expenseModalOpen}
          onClose={handleExpenseModalClose}
          onExpenseRecorded={fetchExpenses}
          editingExpense={editingExpense}
        />
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
