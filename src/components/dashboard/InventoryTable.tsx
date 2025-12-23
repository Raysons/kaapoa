import { MoreHorizontal, ArrowUpDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  image?: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    sku: "WBH-001",
    category: "Electronics",
    stock: 150,
    price: 79.99,
    status: "in-stock",
  },
  {
    id: "2",
    name: "Ergonomic Office Chair",
    sku: "EOC-042",
    category: "Furniture",
    stock: 12,
    price: 299.99,
    status: "low-stock",
  },
  {
    id: "3",
    name: "Stainless Steel Water Bottle",
    sku: "SSW-103",
    category: "Accessories",
    stock: 0,
    price: 24.99,
    status: "out-of-stock",
  },
  {
    id: "4",
    name: "LED Desk Lamp",
    sku: "LDL-078",
    category: "Lighting",
    stock: 85,
    price: 45.99,
    status: "in-stock",
  },
  {
    id: "5",
    name: "Mechanical Keyboard",
    sku: "MKB-256",
    category: "Electronics",
    stock: 8,
    price: 129.99,
    status: "low-stock",
  },
];

const statusConfig = {
  "in-stock": { label: "In Stock", className: "badge-success" },
  "low-stock": { label: "Low Stock", className: "badge-warning" },
  "out-of-stock": { label: "Out of Stock", className: "badge-destructive" },
};

export function InventoryTable() {
  return (
    <div className="rounded-xl border border-border bg-card opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recent Products</h2>
          <p className="text-sm text-muted-foreground">Track your inventory in real-time</p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left">
                <button className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Product
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </th>
              <th className="px-4 py-3 text-left">
                <button className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Stock
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="table-row-hover">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {product.sku}
                  </code>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {product.category}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "font-medium",
                      product.stock === 0
                        ? "text-destructive"
                        : product.stock < 20
                        ? "text-warning"
                        : "text-foreground"
                    )}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-4 font-medium text-foreground">
                  KSH {Number(product.price || 0).toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  <span className={cn("badge-status", statusConfig[product.status].className)}>
                    {statusConfig[product.status].label}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
