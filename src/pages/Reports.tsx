import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  CreditCard,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  const [rangePreset, setRangePreset] = useState<"Today" | "Weekly" | "Monthly" | "Yearly">("Weekly");

  const period = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (rangePreset === "Today") {
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);

      const prevEnd = new Date(start);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 1);
      return { start, end, prevStart, prevEnd };
    }

    if (rangePreset === "Monthly") {
      const start = new Date(end);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const prevEnd = new Date(start);
      const prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
      return { start, end, prevStart, prevEnd };
    }

    if (rangePreset === "Yearly") {
      const start = new Date(end);
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);

      const prevEnd = new Date(start);
      const prevStart = new Date(prevEnd);
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      return { start, end, prevStart, prevEnd };
    }

    // Weekly (default)
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 7);
    return { start, end, prevStart, prevEnd };
  }, [rangePreset]);

  const parseDate = (value: any) => {
    if (!value) return null;
    const s = String(value);
    // Handles 'YYYY-MM-DD' and full ISO timestamps
    return new Date(s.length === 10 ? `${s}T00:00:00` : s);
  };

  const salesChartData = useMemo(() => {
    const sales = (salesData ?? []) as any[];
    return sales.filter((s) => {
      const d = parseDate(s.created_at);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.start && d <= period.end;
    });
  }, [period.end, period.start, salesData]);

  const expensesChartData = useMemo(() => {
    const expenses = (expensesData ?? []) as any[];
    return expenses.filter((e) => {
      const d = parseDate(e.date);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.start && d <= period.end;
    });
  }, [expensesData, period.end, period.start]);

  const totals = useMemo(() => {
    const sales = (salesData ?? []) as any[];
    const expenses = (expensesData ?? []) as any[];

    const salesCurrent = sales.filter((s) => {
      const d = parseDate(s.created_at);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.start && d <= period.end;
    });
    const salesPrev = sales.filter((s) => {
      const d = parseDate(s.created_at);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.prevStart && d < period.prevEnd;
    });

    const expCurrent = expenses.filter((e) => {
      const d = parseDate(e.date);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.start && d <= period.end;
    });
    const expPrev = expenses.filter((e) => {
      const d = parseDate(e.date);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.prevStart && d < period.prevEnd;
    });

    const salesTotal = (rows: any[]) => rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
    const expensesTotal = (rows: any[]) => rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

    const currSales = salesTotal(salesCurrent);
    const prevSales = salesTotal(salesPrev);
    const currExpenses = expensesTotal(expCurrent);
    const prevExpenses = expensesTotal(expPrev);
    const currProfit = currSales - currExpenses;
    const prevProfit = prevSales - prevExpenses;
    const currTx = salesCurrent.length;
    const prevTx = salesPrev.length;
    const avgValue = currTx > 0 ? currSales / currTx : 0;

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / prev) * 100;
    };

    return {
      currSales,
      prevSales,
      currProfit,
      prevProfit,
      currTx,
      prevTx,
      currSalesPct: pctChange(currSales, prevSales),
      currProfitPct: pctChange(currProfit, prevProfit),
      currTxPct: pctChange(currTx, prevTx),
      avgValue,
    };
  }, [expensesData, period.end, period.prevEnd, period.prevStart, period.start, salesData]);

  const paymentMix = useMemo(() => {
    const sales = (salesData ?? []) as any[];
    const rows = sales.filter((s) => {
      const d = parseDate(s.created_at);
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= period.start && d <= period.end;
    });
    const counts = new Map<string, number>();
    for (const r of rows) {
      const method = String(r.payment_method ?? "Unknown");
      counts.set(method, (counts.get(method) ?? 0) + 1);
    }
    const total = rows.length;
    const cashCount = counts.get("Cash") ?? counts.get("cash") ?? 0;
    const cashPct = total > 0 ? (cashCount / total) * 100 : 0;
    return { total, cashPct };
  }, [period.end, period.start, salesData]);

  const inventoryTopShare = useMemo(() => {
    const items = (inventoryData ?? []) as any[];
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0);
    const top = items[0];
    const topQty = Number(top?.quantity ?? 0);
    const pct = totalQty > 0 ? (topQty / totalQty) * 100 : 0;
    return { pct };
  }, [inventoryData]);

  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("created_at, total, payment_method")
        .order("created_at", { ascending: true });
      if (!error) setSalesData(data);
    };

    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("date, amount")
        .order("date", { ascending: true });
      if (!error) setExpensesData(data);
    };

    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name, quantity")
        .order("quantity", { ascending: false });
      if (!error) setInventoryData(data);
    };

    fetchSales();
    fetchExpenses();
    fetchInventory();
  }, []);

  return (
    <DashboardLayout title="Reports">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between opacity-0 animate-fade-up">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Business insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {rangePreset}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRangePreset("Today")}>Today</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRangePreset("Weekly")}>Weekly</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRangePreset("Monthly")}>Monthly</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRangePreset("Yearly")}>Yearly</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-info/20 p-2">
                <DollarSign className="h-5 w-5 text-info" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">KSH {totals.currSales.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-xs text-success mt-1">{totals.currSalesPct >= 0 ? "+" : ""}{totals.currSalesPct.toFixed(1)}% this period</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-success/20 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">KSH {totals.currProfit.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-xs text-success mt-1">{totals.currProfitPct >= 0 ? "+" : ""}{totals.currProfitPct.toFixed(1)}% growth</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-warning/20 p-2">
                <Package className="h-5 w-5 text-warning" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{totals.currTx}</h3>
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-xs text-success mt-1">{totals.currTxPct >= 0 ? "+" : ""}{totals.currTxPct.toFixed(1)}% increase</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="rounded-lg bg-accent/20 p-2">
                <Activity className="h-5 w-5 text-accent" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">KSH {totals.avgValue.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Avg. Value</p>
            <p className="text-xs text-muted-foreground mt-1">Per Transaction</p>
          </div>
        </div>

        {/* Period Comparison */}
        <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Period Comparison</h3>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-info/10">
              <div>
                <p className="font-medium text-foreground">Sales Growth</p>
                <p className="text-sm text-muted-foreground">KSH {totals.currSales.toLocaleString()} vs KSH {totals.prevSales.toLocaleString()}</p>
              </div>
              <span className="text-info font-bold">{totals.currSalesPct >= 0 ? "+" : ""}{totals.currSalesPct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10">
              <div>
                <p className="font-medium text-foreground">Profit Growth</p>
                <p className="text-sm text-muted-foreground">KSH {totals.currProfit.toLocaleString()} vs KSH {totals.prevProfit.toLocaleString()}</p>
              </div>
              <span className="text-success font-bold">{totals.currProfitPct >= 0 ? "+" : ""}{totals.currProfitPct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10">
              <div>
                <p className="font-medium text-foreground">Transaction Growth</p>
                <p className="text-sm text-muted-foreground">{totals.currTx} vs {totals.prevTx} transactions</p>
              </div>
              <span className="text-warning font-bold">{totals.currTxPct >= 0 ? "+" : ""}{totals.currTxPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          {/* Sales Trend */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Sales Trend</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 20%, 88%)" />
                  <XAxis dataKey="created_at" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 20%, 88%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(172, 66%, 40%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Trend */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Profit Trend</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220, 20%, 88%)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 20%, 88%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(152, 69%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue Mix & Key Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {/* Revenue Mix Pie Chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Revenue Mix</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {inventoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[inventoryData.indexOf(item) % COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 text-center">Key Insights</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-card">
                <div className="rounded-lg bg-info/20 p-2 h-fit">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Growth Trend</h4>
                  <p className="text-sm text-muted-foreground">
                    Sales showing consistent upward trajectory with {totals.currSalesPct.toFixed(1)}% improvement
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-card">
                <div className="rounded-lg bg-success/20 p-2 h-fit">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Revenue Mix</h4>
                  <p className="text-sm text-muted-foreground">
                    Top product accounts for {inventoryTopShare.pct.toFixed(1)}% of inventory units
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-card">
                <div className="rounded-lg bg-warning/20 p-2 h-fit">
                  <CreditCard className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Payment Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    Cash remains dominant at {paymentMix.cashPct.toFixed(1)}%, with growing digital adoption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
