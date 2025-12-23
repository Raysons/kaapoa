import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Receipt,
  TrendingUp,
  Package,
  UserPlus,
  BarChart3,
  Search,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  ShoppingBasket,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNotification } from '@/contexts/NotificationContext';

const LOW_STOCK_THRESHOLD = 10;

const Index = () => {
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [todayExpensesTotal, setTodayExpensesTotal] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [weeklySalesTotal, setWeeklySalesTotal] = useState(0);
  const [weeklyExpensesTotal, setWeeklyExpensesTotal] = useState(0);
  const [weeklyNetBalance, setWeeklyNetBalance] = useState(0);
  const [topProductsWeek, setTopProductsWeek] = useState<Array<{ name: string; quantity: number }>>([]);
  const { notifyInfo } = useNotification();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

      const startOf7Days = new Date(startOfToday);
      startOf7Days.setDate(startOf7Days.getDate() - 6);

      const todayDateStr = startOfToday.toISOString().slice(0, 10);
      const startOf7DaysStr = startOf7Days.toISOString().slice(0, 10);

      const [productsRes, salesTodayRes, expensesTodayRes, sales7Res, expenses7Res, items7Res] = await Promise.all([
        supabase.from("products").select("id, name, quantity, low_stock_threshold").order("quantity", { ascending: true }),
        supabase
          .from("sales")
          .select("id, total, created_at")
          .gte("created_at", startOfToday.toISOString())
          .lt("created_at", startOfTomorrow.toISOString()),
        supabase.from("expenses").select("id, amount, date").eq("date", todayDateStr),
        supabase.from("sales").select("id, total, created_at").gte("created_at", startOf7Days.toISOString()),
        supabase.from("expenses").select("id, amount, date").gte("date", startOf7DaysStr),
        supabase
          .from("sale_items")
          .select("product_name, quantity, created_at")
          .gte("created_at", startOf7Days.toISOString()),
      ]);

      if (!productsRes.error) {
        const rows = productsRes.data ?? [];
        setTotalProductsCount(rows.length);

        const low = rows
          .filter((p: any) => {
            const threshold = typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : LOW_STOCK_THRESHOLD;
            return Number(p.quantity ?? 0) > 0 && Number(p.quantity ?? 0) <= threshold;
          })
          .sort((a: any, b: any) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0));

        setLowStockProducts(low);
        if (low.length > 0) {
          notifyInfo(`You have ${low.length} products low in stock.`);
        }
      }

      if (!salesTodayRes.error) {
        const rows = salesTodayRes.data ?? [];
        const total = rows.reduce((sum: number, s: any) => sum + Number(s.total ?? 0), 0);
        setTodaySalesTotal(total);
        setTodaySalesCount(rows.length);
      }

      if (!expensesTodayRes.error) {
        const rows = expensesTodayRes.data ?? [];
        const total = rows.reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);
        setTodayExpensesTotal(total);
      }

      if (!sales7Res.error) {
        const rows = sales7Res.data ?? [];
        const total = rows.reduce((sum: number, s: any) => sum + Number(s.total ?? 0), 0);
        setWeeklySalesTotal(total);
      }

      if (!expenses7Res.error) {
        const rows = expenses7Res.data ?? [];
        const total = rows.reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);
        setWeeklyExpensesTotal(total);
      }

      if (!items7Res.error) {
        const rows = items7Res.data ?? [];
        const map = new Map<string, number>();
        for (const r of rows as any[]) {
          const name = String(r.product_name ?? "").trim();
          if (!name) continue;
          map.set(name, (map.get(name) ?? 0) + Number(r.quantity ?? 0));
        }
        const top = Array.from(map.entries())
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        setTopProductsWeek(top);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    setTodayProfit(todaySalesTotal - todayExpensesTotal);
  }, [todaySalesTotal, todayExpensesTotal]);

  useEffect(() => {
    setWeeklyNetBalance(weeklySalesTotal - weeklyExpensesTotal);
  }, [weeklySalesTotal, weeklyExpensesTotal]);

  return (
    <DashboardLayout title="Hello, araysondesign">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Title */}
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your business performance
          </p>
        </div>

        {/* Alert Banner */}
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="rounded-lg bg-warning/20 p-2 mr-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Attention Required
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {lowStockProducts.length} low stock alerts
                </p>
                <div className="space-y-2">
                  {(lowStockProducts ?? []).slice(0, 3).map((p: any) => (
                    <div key={p.id} className="flex items-start text-sm">
                      <span className="w-1.5 h-1.5 bg-warning rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <div>
                        <span className="font-medium text-foreground">Low Stock Alert</span>
                        <p className="text-muted-foreground">
                          {p.name} has only {p.quantity} units left
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="default" size="sm" onClick={() => navigate('/inventory')} className="bg-accent text-accent-foreground hover:bg-accent/90">
              View All
            </Button>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-lg bg-info p-3">
                <ShoppingCart className="h-6 w-6 text-info-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">KSH {todaySalesTotal.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-1">Today's Sales</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-lg bg-success p-3">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">KSH {todayProfit.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-1">Today's Profit</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-lg bg-secondary p-3">
                <Package className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{totalProductsCount}</h3>
            <p className="text-sm text-muted-foreground mt-1">Total Products</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/sales')}
              className="group rounded-xl border border-success/30 bg-success/10 p-6 text-center transition-all duration-200 hover:bg-success/20 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-success p-4 mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-success-foreground" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">Record Sale</h4>
              <p className="text-xs text-muted-foreground">Add new sales transaction</p>
            </button>

            <button
              onClick={() => navigate('/expenses')}
              className="group rounded-xl border border-info/30 bg-info/10 p-6 text-center transition-all duration-200 hover:bg-info/20 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-info p-4 mb-3 group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6 text-info-foreground" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">Record Expense</h4>
              <p className="text-xs text-muted-foreground">Track business expenses</p>
            </button>

            <button
              onClick={() => navigate('/debtors')}
              className="group rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center transition-all duration-200 hover:bg-destructive/20 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-destructive p-4 mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="h-6 w-6 text-destructive-foreground" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">Add Debtor</h4>
              <p className="text-xs text-muted-foreground">Manage credit customers</p>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="group rounded-xl border border-warning/30 bg-warning/10 p-6 text-center transition-all duration-200 hover:bg-warning/20 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-warning p-4 mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-warning-foreground" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">View Reports</h4>
              <p className="text-xs text-muted-foreground">Business analytics & insights</p>
            </button>
          </div>
        </div>

        {/* Browse Products */}
        <button
          onClick={() => navigate('/products/browse')}
          className="w-full group rounded-xl border border-accent/30 bg-accent/10 p-6 text-center transition-all duration-200 hover:bg-accent/20 hover:shadow-md opacity-0 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="inline-flex rounded-xl bg-accent p-4 mb-3 group-hover:scale-110 transition-transform">
            <Search className="h-6 w-6 text-accent-foreground" />
          </div>
          <h4 className="text-sm font-bold text-foreground mb-1">Browse Products</h4>
          <p className="text-xs text-muted-foreground">View and manage your product catalog</p>
        </button>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-0 animate-fade-up" style={{ animationDelay: "250ms" }}>
          {/* 7-Day Trend Analysis */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">7-Day Trend Analysis</h3>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 mb-6 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-info rounded-full mr-2"></span>
                <span className="text-muted-foreground">Sales</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-destructive rounded-full mr-2"></span>
                <span className="text-muted-foreground">Expenses</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-success rounded-full mr-2"></span>
                <span className="text-muted-foreground">Profit</span>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">Chart data will appear here</p>
            </div>
          </div>

          {/* Top Products This Week */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Top Products This Week</h3>
              <button className="text-xs text-accent hover:text-accent/80 font-medium">
                View All
              </button>
            </div>
            {topProductsWeek.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No sales data this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProductsWeek.map((p) => (
                  <div key={p.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-medium text-foreground truncate pr-4">{p.name}</p>
                    <span className="text-xs font-bold text-muted-foreground">{p.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
