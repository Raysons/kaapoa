import { Link } from "react-router-dom";
import { Plus, Upload, FileDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    icon: Plus,
    label: "Add Product",
    description: "Create a new product entry",
    path: "/add-product",
    color: "bg-accent text-accent-foreground",
  },
  {
    icon: Upload,
    label: "Bulk Upload",
    description: "Import multiple products",
    path: "/bulk-upload",
    color: "bg-info text-info-foreground",
  },
  {
    icon: FileDown,
    label: "Export Data",
    description: "Download inventory report",
    path: "#",
    color: "bg-success text-success-foreground",
  },
  {
    icon: RefreshCw,
    label: "Sync Stock",
    description: "Refresh stock levels",
    path: "#",
    color: "bg-warning text-warning-foreground",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-accent hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                action.color
              )}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
