import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, Pencil, Printer, Tag, Trash2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AddProductModal } from "@/components/modals/AddProductModal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type ProductDetailsRow = {
  id: string;
  name: string;
  description?: string | null;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  buying_price: number | null;
  selling_price: number | null;
  quantity: number | null;
  low_stock_threshold: number | null;
  unit: string | null;
  image_url: string | null;
};

export default function ProductDetails() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetailsRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, category, sku, barcode, buying_price, selling_price, quantity, low_stock_threshold, unit, image_url"
      )
      .eq("id", id)
      .single();
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setProduct((data ?? null) as ProductDetailsRow | null);
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const derived = useMemo(() => {
    if (!product) {
      return {
        status: "Out of Stock" as "In Stock" | "Low Stock" | "Out of Stock",
        selling: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        qty: 0,
        threshold: 5,
        unit: "pcs",
      };
    }

    const selling = Number(product.selling_price ?? 0);
    const cost = Number(product.buying_price ?? 0);
    const qty = Number(product.quantity ?? 0);
    const threshold = typeof product.low_stock_threshold === "number" ? product.low_stock_threshold : 5;
    const unit = product.unit || "pcs";

    const profit = selling - cost;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;

    const status = qty === 0 ? "Out of Stock" : qty <= threshold ? "Low Stock" : "In Stock";

    return {
      status,
      selling,
      cost,
      profit,
      margin,
      qty,
      threshold,
      unit,
    };
  }, [product]);

  return (
    <DashboardLayout title="Dashboard" showSearch={false}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between opacity-0 animate-fade-up">
          <Link
            to="/products"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="bg-card"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => setEditOpen(true)}
              disabled={!product}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Update Product
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Not available",
                  description: "Deleting products is not enabled yet.",
                  variant: "destructive",
                })
              }
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6">Loading...</div>
        ) : !product ? (
          <div className="rounded-xl border border-border bg-card p-6">Product not found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl bg-muted/40 h-[420px] flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-foreground truncate">{product.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {product.category || "Uncategorized"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      SKU: {product.sku || "-"}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                    derived.status === "In Stock"
                      ? "bg-success/10 text-success"
                      : derived.status === "Low Stock"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                  )}
                >
                  {derived.status}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-primary/5 p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Pricing Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Selling Price</p>
                    <p className="text-2xl font-bold text-foreground">KSh {derived.selling.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cost Price</p>
                    <p className="text-lg font-bold text-foreground">KSh {derived.cost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Profit Margin:</p>
                  <p className="text-xs font-medium text-success">
                    KSh {derived.profit.toLocaleString()}({derived.margin.toFixed(1)}%)
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Stock Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold text-foreground">
                      {derived.qty} {derived.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Minimum Stock Level</p>
                    <p className="text-lg font-bold text-foreground">
                      {derived.threshold} {derived.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <AddProductModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          productToEdit={product}
          onProductAdded={async () => {
            setEditOpen(false);
            await fetchProduct();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
