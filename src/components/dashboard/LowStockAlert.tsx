import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const lowStockItems = [
  { name: "Ergonomic Office Chair", sku: "EOC-042", stock: 12, threshold: 15 },
  { name: "Mechanical Keyboard", sku: "MKB-256", stock: 8, threshold: 10 },
  { name: "USB-C Hub", sku: "UCH-089", stock: 5, threshold: 20 },
];

export function LowStockAlert() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 opacity-0 animate-fade-up" style={{ animationDelay: "250ms" }}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
          <p className="text-xs text-muted-foreground">{lowStockItems.length} items need attention</p>
        </div>
      </div>
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div
            key={item.sku}
            className="flex items-center justify-between rounded-lg bg-background p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.stock} left / threshold: {item.threshold}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-accent hover:text-accent">
              Reorder
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
