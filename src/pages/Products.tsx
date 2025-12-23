import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNotification } from "@/contexts/NotificationContext";
import { BulkUploadModal } from "@/components/modals/BulkUploadModal";
import { AddProductModal } from "@/components/modals/AddProductModal";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  Tag,
  Plus,
  Upload,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const Products = () => {
  const navigate = useNavigate();
  const { notifyInfo } = useNotification();
  const [products, setProducts] = useState([]);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const thresholdOf = (p: any) => (typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : 5);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, quantity, low_stock_threshold, selling_price, created_at")
        .order("created_at", { ascending: false });
      if (!error) {
        setProducts(data);
        const lowStock = data.filter((p: any) => p.quantity > 0 && p.quantity <= thresholdOf(p));
        if (lowStock.length > 0) {
          notifyInfo(`You have ${lowStock.length} products low in stock.`);
        }
      }
    };

    fetchProducts();
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, quantity, low_stock_threshold, selling_price, created_at")
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data);
    }
  }, []);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
  const lowStockCount = products.filter((p: any) => p.quantity > 0 && p.quantity <= thresholdOf(p)).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  const potentialValue = totalValue;

  const recentProducts = products.slice(0, 5);

  return (
    <DashboardLayout title="Products">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage Product Catalog</p>
        </div>

        {/* Overview Stats */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex justify-between items-start">
                <div className="rounded-lg bg-info/20 p-2 text-info">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Total Products</span>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold text-foreground">{totalProducts}</h3>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex justify-between items-start">
                <div className="rounded-lg bg-success/20 p-2 text-success">
                  <Tag className="h-5 w-5" />
                </div>
                <button className="text-xs font-medium text-accent flex items-center hover:underline">
                  Cost <ArrowUpRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cost Value</p>
                <h3 className="text-2xl font-bold text-foreground">KSH {totalValue.toLocaleString()}</h3>
                <p className="text-xs text-success mt-1">Potential: KSH {potentialValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-[10px] font-medium text-muted-foreground">Low Stock</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-2">{lowStockCount}</h3>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between items-start">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-[10px] font-medium text-muted-foreground">Out of Stock</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mt-2">{outOfStockCount}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setAddProductOpen(true)}
              className="flex items-center justify-center p-4 rounded-xl border border-info/30 bg-info/10 text-info font-medium hover:bg-info/20 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
            <button
              onClick={() => setBulkUploadOpen(true)}
              className="flex items-center justify-center p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning font-medium hover:bg-warning/20 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={() => navigate('/products/browse')}
              className="flex items-center justify-center p-4 rounded-xl border border-success/30 bg-success/10 text-success font-medium hover:bg-success/20 transition-colors"
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Products
            </button>
          </div>
        </section>

        {/* Products List */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Recently Added</h3>
          <div className="space-y-3">
            {recentProducts.length === 0 ? (
              <p>No products found.</p>
            ) : (
              recentProducts.map((product: any) => {
                const threshold = thresholdOf(product);
                const status =
                  product.quantity === 0
                    ? "Out of Stock"
                    : product.quantity <= threshold
                      ? "Low Stock"
                      : "In Stock";
                const priceLabel = `KSH ${Number(product.selling_price || 0).toLocaleString()}`;
                const subtitle = `${Number(product.quantity || 0)} pcs - ${product.category || ""}`;

                return (
                  <div
                    key={product.id}
                    className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-success">{priceLabel}</p>
                        <p
                          className={
                            status === "In Stock"
                              ? "text-[11px] text-success"
                              : status === "Low Stock"
                                ? "text-[11px] text-warning"
                                : "text-[11px] text-destructive"
                          }
                        >
                          {status}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-xs font-medium text-accent hover:underline flex items-center"
                      >
                        View Details
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <BulkUploadModal
          isOpen={bulkUploadOpen}
          onClose={() => setBulkUploadOpen(false)}
          onUploaded={async () => {
            setBulkUploadOpen(false);
            await fetchProducts();
          }}
        />

        <AddProductModal
          isOpen={addProductOpen}
          onClose={() => setAddProductOpen(false)}
          onProductAdded={async () => {
            setAddProductOpen(false);
            await fetchProducts();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Products;
