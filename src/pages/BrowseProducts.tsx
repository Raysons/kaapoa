import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Package, Edit2, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { AddProductModal } from "@/components/modals/AddProductModal";

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  description?: string | null;
  buying_price?: number | null;
  selling_price: number;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  image_url: string | null;
};

const BrowseProducts = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductRow | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, category, sku, barcode, description, buying_price, selling_price, quantity, unit, low_stock_threshold, image_url"
      )
      .order("name", { ascending: true });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setProducts((data ?? []) as ProductRow[]);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productCards = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products
      .map((p) => {
        const threshold = typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : 5;
        const status =
          p.quantity === 0
            ? "Out of Stock"
            : p.quantity <= threshold
              ? "Low Stock"
              : "In Stock";

        return {
          ...p,
          _status: status as "In Stock" | "Low Stock" | "Out of Stock",
          _priceLabel: `KSh ${Number(p.selling_price || 0).toLocaleString()}`,
          _stockLabel: `${Number(p.quantity || 0)} ${p.unit || "pcs"}`,
        };
      })
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.name ?? ""} ${p.category ?? ""} ${p.sku ?? ""} ${p.barcode ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .filter((p) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "in") return p._status === "In Stock";
        if (statusFilter === "low") return p._status === "Low Stock";
        if (statusFilter === "out") return p._status === "Out of Stock";
        return true;
      });
  }, [products, search, statusFilter]);

  const counts = useMemo(() => {
    const thresholdOf = (p: ProductRow) => (typeof p.low_stock_threshold === "number" ? p.low_stock_threshold : 5);
    const inStock = products.filter((p) => p.quantity > thresholdOf(p)).length;
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= thresholdOf(p)).length;
    const outOfStock = products.filter((p) => p.quantity === 0).length;
    return {
      all: products.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return (
    <DashboardLayout title="Browse Products">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between opacity-0 animate-fade-up">
          <div className="flex items-center gap-4">
            <Link
              to="/products"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Browse Products</h1>
              <p className="text-sm text-muted-foreground">
                Showing {productCards.length} of {counts.all} products
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setProductToEdit(null);
              setAddProductOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <Input
            placeholder="Search products by name, SKU, category, barcode, or tags..."
            className="mb-4 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                statusFilter === "all"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              All Products ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter("in")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                statusFilter === "in"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              In Stock ({counts.inStock})
            </button>
            <button
              onClick={() => setStatusFilter("low")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                statusFilter === "low"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              Low Stock ({counts.lowStock})
            </button>
            <button
              onClick={() => setStatusFilter("out")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                statusFilter === "out"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              Out of Stock ({counts.outOfStock})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-6">Loading...</div>
          ) : productCards.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-6">No products found.</div>
          ) : productCards.map((product, index) => (
            <div
              key={product.id}
              className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-200 opacity-0 animate-fade-up"
              style={{ animationDelay: `${100 + index * 30}ms` }}
            >
              {/* Product Image Placeholder */}
              <div className="relative h-48 bg-muted flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground" />
                )}
                <div className="absolute top-3 left-3">
                  <span
                    className={cn(
                      "badge-status",
                      product._status === "In Stock"
                        ? "badge-success"
                        : product._status === "Out of Stock"
                          ? "badge-destructive"
                          : "badge-warning"
                    )}
                  >
                    {product._status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-bold text-foreground mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.category || ""}</p>
                <p className="text-xs text-muted-foreground/70 mb-3 font-mono">SKU: {product.sku || ""}</p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">{product._priceLabel}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product._stockLabel}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg text-accent bg-accent/10 hover:bg-accent/20 transition-colors">
                    <Search className="h-3 w-3 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setProductToEdit(product);
                      setAddProductOpen(true);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AddProductModal
          isOpen={addProductOpen}
          onClose={() => {
            setAddProductOpen(false);
            setProductToEdit(null);
          }}
          productToEdit={productToEdit}
          onProductAdded={async () => {
            setAddProductOpen(false);
            setProductToEdit(null);
            await fetchProducts();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default BrowseProducts;
