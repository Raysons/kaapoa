import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Truck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Package,
  Building2,
} from "lucide-react";

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "stock" | "movements" | "transfers">("dashboard");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, quantity, low_stock_threshold, buying_price, selling_price, updated_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setProducts(data ?? []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("id, product_id, transaction_type, quantity, reference_id, notes, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setTransactionsLoaded(true);
      setTransactions([]);
      return;
    }
    setTransactionsLoaded(true);
    setTransactions(data ?? []);
  };

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProducts(), fetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const metrics = useMemo(() => {
    const thresholdOf = (p: any) => (typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : 10);
    const total = products.length;
    const outOfStock = products.filter((p) => Number(p.quantity ?? 0) === 0).length;
    const lowStock = products.filter((p) => {
      const q = Number(p.quantity ?? 0);
      return q > 0 && q <= thresholdOf(p);
    }).length;
    const inStock = Math.max(0, total - outOfStock - lowStock);
    const inventoryValue = products.reduce((sum, p) => {
      const q = Number(p.quantity ?? 0);
      const unitCost = Number(p.buying_price ?? p.selling_price ?? 0);
      return sum + q * unitCost;
    }, 0);

    return {
      total,
      outOfStock,
      lowStock,
      inStock,
      inventoryValue,
    };
  }, [products]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const hasAnyTransactions = useMemo(() => (transactionsLoaded ? transactions.length > 0 : false), [transactionsLoaded, transactions]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  const handleInitializeInventory = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Not authenticated");

      const initial = products
        .filter((p) => Number(p.quantity ?? 0) > 0)
        .map((p) => ({
          user_id: userData.user.id,
          product_id: p.id,
          transaction_type: "purchase",
          quantity: Number(p.quantity),
          notes: "Initial stock",
        }));

      if (initial.length === 0) {
        toast({ title: "No stock to initialize", description: "All products currently have 0 quantity." });
        return;
      }

      const { error } = await supabase.from("inventory_transactions").insert(initial);
      if (error) throw error;

      toast({ title: "Inventory initialized", description: "Initial stock movements have been created." });
      await fetchTransactions();
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to initialize inventory", variant: "destructive" });
    }
  };

  const tabButtonClass = (tab: typeof activeTab) =>
    tab === activeTab
      ? "flex-1 py-2 px-4 text-sm font-medium rounded-md bg-card text-foreground shadow-sm"
      : "flex-1 py-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground";

  return (
    <DashboardLayout title="Inventory Management">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between opacity-0 animate-fade-up">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your stock across branches
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="rounded-lg bg-muted p-1 inline-flex w-full opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <button className={tabButtonClass("dashboard")} onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button className={tabButtonClass("stock")} onClick={() => setActiveTab("stock")}>
            Stock Levels
          </button>
          <button className={tabButtonClass("movements")} onClick={() => setActiveTab("movements")}>
            Movements
          </button>
          <button className={tabButtonClass("transfers")} onClick={() => setActiveTab("transfers")}>
            Transfers
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-info/20 p-3">
                    <Package className="h-6 w-6 text-info" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{metrics.total}</h3>
                <p className="text-sm text-muted-foreground mt-1">Total Products</p>
              </div>

              <div className="rounded-xl border border-warning/30 bg-warning/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-warning/20 p-3">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{metrics.lowStock}</h3>
                <p className="text-sm text-muted-foreground mt-1">Low Stock Items</p>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-destructive/20 p-3">
                    <Archive className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{metrics.outOfStock}</h3>
                <p className="text-sm text-muted-foreground mt-1">Out of Stock</p>
              </div>

              <div className="rounded-xl border border-success/30 bg-success/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-success/20 p-3">
                    <Truck className="h-6 w-6 text-success" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Ksh {metrics.inventoryValue.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground mt-1">Inventory Value</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <h3 className="text-lg font-bold text-foreground mb-4">Recent Stock Movements</h3>
              {recentTransactions.length === 0 ? (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">No recent movements</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {t.products?.name || "Product"}
                        </div>
                        <div className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{t.transaction_type}</div>
                        <div className="text-xs text-muted-foreground">Qty: {t.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="rounded-xl border border-info/30 bg-info/10 p-6">
                <div className="flex items-center mb-6">
                  <Archive className="h-5 w-5 text-info mr-2" />
                  <h3 className="font-bold text-foreground">Stock Health</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-success">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">In Stock</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-success/20 text-success">{metrics.inStock}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-warning">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Low Stock</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-warning/20 text-warning">{metrics.lowStock}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Out of Stock</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive">{metrics.outOfStock}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-accent/30 bg-accent/10 p-6">
                <div className="flex items-center mb-6">
                  <h3 className="font-bold text-foreground">Quick Actions</h3>
                </div>

                <div className="space-y-4">
                  <button
                    className="flex items-center text-accent hover:text-accent/80 transition-colors w-full text-left"
                    onClick={() => setActiveTab("movements")}
                  >
                    <Clock className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">View Movements</span>
                  </button>
                  <button
                    className="flex items-center text-accent hover:text-accent/80 transition-colors w-full text-left"
                    onClick={() => setActiveTab("transfers")}
                  >
                    <Truck className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">Manage Transfers</span>
                  </button>
                  <button
                    className="flex items-center text-accent hover:text-accent/80 transition-colors w-full text-left"
                    onClick={() => navigate("/products/browse")}
                  >
                    <Package className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">Browse Products</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-success/30 bg-success/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-success mr-2" />
                    <h3 className="font-bold text-foreground">Branch Overview</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Active Branch</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold border border-success/30 bg-success/20 text-success">Main Branch</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total Value</span>
                    <span className="text-sm font-bold text-foreground">Ksh {metrics.inventoryValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Last Updated</span>
                    <span className="text-xs text-muted-foreground">{products[0]?.updated_at ? fmtDate(products[0].updated_at) : "Just now"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 opacity-0 animate-fade-up" style={{ animationDelay: "250ms" }}>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("stock")}>View All Stock</Button>
              <Button
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => navigate("/products")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Products
              </Button>
            </div>
          </>
        )}

        {activeTab === "stock" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Stock Levels</h3>
              <Button
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={handleInitializeInventory}
                disabled={products.length === 0 || hasAnyTransactions}
              >
                <Plus className="h-4 w-4 mr-2" />
                Initialize Inventory
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">No products found. Add products first to start tracking inventory.</p>
                <div className="mt-4">
                  <Button onClick={() => navigate("/products")}>Manage Products First</Button>
                </div>
              </div>
            ) : !hasAnyTransactions ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="rounded-xl bg-success/10 border border-success/20 p-10 text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <Package className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Ready to Track Inventory?</h3>
                  <p className="text-sm text-muted-foreground">
                    Great! You have <span className="font-bold text-foreground">{metrics.total} products</span> in your catalog.
                    Let&apos;s set up inventory tracking to monitor stock levels, movements, and alerts.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      className="bg-success text-success-foreground hover:bg-success/90"
                      onClick={handleInitializeInventory}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Initialize Inventory for {metrics.total} Products
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/products")}>Manage Products First</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {products.map((p) => {
                    const q = Number(p.quantity ?? 0);
                    const threshold = typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : 10;
                    const status = q === 0 ? "Out of Stock" : q <= threshold ? "Low Stock" : "In Stock";
                    const badgeClass =
                      q === 0
                        ? "bg-destructive/20 text-destructive"
                        : q <= threshold
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success";

                    return (
                      <div key={p.id} className="flex items-center justify-between px-6 py-4">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{p.name || "Product"}</div>
                          <div className="text-xs text-muted-foreground">Threshold: {threshold}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground">{q}</div>
                            <div className="text-xs text-muted-foreground">In stock</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>{status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "movements" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Stock Movement History</h3>
            {transactions.length === 0 ? (
              <div className="h-28 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No stock movements found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((t: any) => (
                  <div key={t.id} className="py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.products?.name || "Product"}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.notes || ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{t.transaction_type}</div>
                      <div className="text-xs text-muted-foreground">Qty: {t.quantity} · {fmtDate(t.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "transfers" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <Truck className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-bold text-foreground">Stock Transfers</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-1">
                Transfer functionality will be available when you have multiple branches.
              </p>
              <p className="text-muted-foreground text-sm mt-2">You currently have 1 branch. Add another branch to enable transfers.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
