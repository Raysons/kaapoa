import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { RecordSaleModal } from "@/components/modals/RecordSaleModal";
import { ReceiptPreviewModal } from "@/components/modals/ReceiptPreviewModal";

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);
  const [todayProfit, setTodayProfit] = useState(0);
  const [latestSaleItemSummary, setLatestSaleItemSummary] = useState<string>("");

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }, []);

  const monthRange = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start };
  }, []);

  const todayMetrics = useMemo(() => {
    const startMs = todayRange.start.getTime();
    const endMs = todayRange.end.getTime();
    const todays = (sales ?? []).filter((s: any) => {
      const t = new Date(s.created_at).getTime();
      return t >= startMs && t < endMs;
    });
    const revenue = todays.reduce((sum: number, s: any) => sum + Number(s.total ?? 0), 0);
    return { count: todays.length, revenue };
  }, [sales, todayRange.end, todayRange.start]);

  const monthMetrics = useMemo(() => {
    const startMs = monthRange.start.getTime();
    const rows = (sales ?? []).filter((s: any) => new Date(s.created_at).getTime() >= startMs);
    const revenue = rows.reduce((sum: number, s: any) => sum + Number(s.total ?? 0), 0);
    return { count: rows.length, revenue };
  }, [monthRange.start, sales]);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("id, sale_number, customer_name, total, created_at")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSales(data);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const fetchTodayProfit = async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("quantity, line_total, created_at, products(buying_price)")
        .gte("created_at", todayRange.start.toISOString())
        .lt("created_at", todayRange.end.toISOString());

      if (error) {
        setTodayProfit(0);
        return;
      }

      const profit = (data ?? []).reduce((sum: number, row: any) => {
        const qty = Number(row.quantity ?? 0);
        const lineTotal = Number(row.line_total ?? 0);
        const buyingPrice = Number(row.products?.buying_price ?? 0);
        return sum + (lineTotal - qty * buyingPrice);
      }, 0);

      setTodayProfit(profit);
    };

    fetchTodayProfit();
  }, [todayRange.end, todayRange.start]);

  useEffect(() => {
    const fetchLatestSaleItems = async () => {
      const latest = (sales ?? [])[0] as any;
      if (!latest?.id) {
        setLatestSaleItemSummary("");
        return;
      }

      const { data, error } = await supabase
        .from("sale_items")
        .select("product_name, quantity")
        .eq("sale_id", latest.id);

      if (error) {
        setLatestSaleItemSummary("");
        return;
      }

      const items = data ?? [];
      if (items.length === 0) {
        setLatestSaleItemSummary("");
        return;
      }

      const first = items[0] as any;
      const moreCount = Math.max(0, items.length - 1);
      const base = `${String(first.product_name ?? "Item")} x ${Number(first.quantity ?? 0)}`;
      setLatestSaleItemSummary(moreCount > 0 ? `${base} +${moreCount} more` : base);
    };

    fetchLatestSaleItems();
  }, [sales]);

  return (
    <DashboardLayout title="Sales">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground">Sales</h2>
          <p className="text-sm text-muted-foreground mt-1">Record & Track Sales</p>
        </div>

        {/* Quick Actions */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setRecordSaleOpen(true)}
              className="flex items-center justify-center gap-3 p-6 rounded-xl bg-warning text-warning-foreground font-bold text-lg hover:bg-warning/90 transition-colors shadow-md"
            >
              <Receipt className="h-6 w-6" />
              Record Sale
            </button>
            <button
              onClick={() => navigate("/dashboard/sales/history")}
              className="flex items-center justify-center gap-3 p-6 rounded-xl bg-success text-success-foreground font-bold text-lg hover:bg-success/90 transition-colors shadow-md"
            >
              <FileText className="h-6 w-6" />
              View History
            </button>
          </div>
        </section>

        {/* Today's Performance */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Today's Performance</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <TrendingUp className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Today's Sales</p>
              <h3 className="text-3xl font-bold text-success">{todayMetrics.count}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Today's Revenue</p>
              <h3 className="text-3xl font-bold text-info">KSH {todayMetrics.revenue.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Today's Profit</p>
              <h3 className="text-3xl font-bold text-warning">KSH {todayProfit.toLocaleString()}</h3>
            </div>
          </div>
        </section>

        
        {/* Monthly Overview */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Monthly Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Sales This Month</p>
              <h3 className="text-3xl font-bold text-success">{monthMetrics.count}</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
              <h3 className="text-3xl font-bold text-info">KSH {monthMetrics.revenue.toLocaleString()}</h3>
            </div>
          </div>
        </section>

        {/* Recent Sales */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Recent Sales</h3>
            <button 
              onClick={() => navigate("/dashboard/sales/history")}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
                <p className="text-muted-foreground">Loading recent sales...</p>
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No sales recorded yet</p>
                <Button onClick={() => setRecordSaleOpen(true)} className="bg-warning text-warning-foreground hover:bg-warning/90">
                  Record Your First Sale
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(sales.slice(0, 5)).map((sale: any, index: number) => (
                  <div 
                    key={sale.id} 
                    className={`w-full rounded-xl border border-border bg-background p-4 cursor-pointer transition-all hover:shadow-md ${index === 0 ? 'ring-2 ring-accent/20' : ''}`}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">Sale #{sale.sale_number}</p>
                          {index === 0 && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Latest</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer_name || "Guest"} • {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">KSH {Number(sale.total ?? 0).toLocaleString()}</p>
                        <span className="text-xs text-success font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
                {sales.length > 5 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/dashboard/sales/history")}
                      className="text-accent border-accent/20 hover:bg-accent/10"
                    >
                      View {sales.length - 5} More Sales →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <RecordSaleModal
          isOpen={recordSaleOpen}
          onClose={() => setRecordSaleOpen(false)}
          onRecordSale={(saleId) => {
            fetchSales();
            if (saleId) {
              setReceiptSaleId(String(saleId));
              setReceiptOpen(true);
            }
          }}
        />

        <ReceiptPreviewModal
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          saleId={receiptSaleId ?? undefined}
        />
      </div>
    </DashboardLayout>
  );
};

export default Sales;
