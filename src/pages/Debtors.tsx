import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Plus, Users, Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AddDebtorModal } from "@/components/modals/AddDebtorModal";
import { useDebtors } from "@/hooks/useDebtors";
import { supabase } from "@/lib/supabase";

const Debtors = () => {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const { debtors, isLoading, error } = useDebtors();
  const [todaysPaymentsTotal, setTodaysPaymentsTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Overdue" | "High Risk" | "At Limit">("All");

  const totalOutstanding = useMemo(() => {
    return (debtors ?? []).reduce((sum: number, d: any) => sum + Number(d.outstanding_balance ?? 0), 0);
  }, [debtors]);

  const highRiskCount = useMemo(() => {
    return (debtors ?? []).filter((d: any) => {
      const outstanding = Number(d.outstanding_balance ?? 0);
      const limit = Number(d.credit_limit ?? 0);
      if (outstanding <= 0) return false;
      if (limit <= 0) return outstanding > 0;
      return outstanding / limit >= 0.8;
    }).length;
  }, [debtors]);

  const filteredDebtors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matchesSearch = (d: any) => {
      if (!q) return true;
      const name = String(d?.name ?? "").toLowerCase();
      const phone = String(d?.phone ?? "").toLowerCase();
      const email = String(d?.email ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    };

    const getDueDate = (d: any) => {
      const candidates = [d?.due_date, d?.payment_due_date, d?.next_payment_date, d?.next_due_date, d?.due_on];
      for (const c of candidates) {
        if (!c) continue;
        const date = new Date(String(c));
        if (!Number.isNaN(date.getTime())) return date;
      }
      const created = new Date(String(d?.created_at ?? ""));
      if (Number.isNaN(created.getTime())) return null;
      const fallback = new Date(created);
      fallback.setDate(fallback.getDate() + 30);
      return fallback;
    };

    const matchesFilter = (d: any) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Active") return d?.is_active !== false;

      const outstanding = Number(d?.outstanding_balance ?? 0);
      const limit = Number(d?.credit_limit ?? 0);

      if (activeFilter === "High Risk") {
        if (outstanding <= 0) return false;
        if (limit <= 0) return true;
        return outstanding / limit >= 0.8;
      }

      if (activeFilter === "At Limit") {
        if (limit <= 0) return false;
        return outstanding >= limit;
      }

      if (activeFilter === "Overdue") {
        if (outstanding <= 0) return false;
        const due = getDueDate(d);
        if (!due) return false;
        return due.getTime() < Date.now();
      }

      return true;
    };

    return (debtors ?? []).filter((d: any) => matchesSearch(d) && matchesFilter(d));
  }, [activeFilter, debtors, searchQuery]);

  useEffect(() => {
    const fetchTodaysPayments = async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const { data, error } = await supabase
        .from("payments")
        .select("amount, created_at")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) {
        // If the table isn't present or RLS blocks, keep UI stable.
        setTodaysPaymentsTotal(0);
        return;
      }

      const total = (data ?? []).reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);
      setTodaysPaymentsTotal(total);
    };

    fetchTodaysPayments();
  }, []);

  useEffect(() => {
    if (!error) return;
    // Keep UI simple; also surface error to user.
    toast({ title: "Error", description: String((error as any)?.message || error), variant: "destructive" });
  }, [error]);

  return (
    <DashboardLayout title="Debtors">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl font-bold text-foreground">Debtors</h2>
          <p className="text-sm text-muted-foreground mt-1">Create a new credit customer</p>
        </div>

        {/* Add New Debtor Button */}
        <button
          onClick={() => setAddOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-6 rounded-xl bg-info text-info-foreground font-bold hover:bg-info/90 transition-colors shadow-md opacity-0 animate-fade-up"
          style={{ animationDelay: "50ms" }}
        >
          <Plus className="h-5 w-5" />
          Add New Debtor
        </button>

        {/* Summary */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-bold text-foreground mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-info/30 bg-info/10 p-6">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-info" />
                <div className="text-right">
                  <h3 className="text-3xl font-bold text-info">{(debtors ?? []).length}</h3>
                  <p className="text-sm text-info/80 mt-1">Total Debtors</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-6">
              <div className="flex items-center justify-between">
                <Wallet className="h-8 w-8 text-warning" />
                <div className="text-right">
                  <h3 className="text-3xl font-bold text-warning">KSH {totalOutstanding.toLocaleString()}</h3>
                  <p className="text-sm text-warning/80 mt-1">Outstanding Debt</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-success/30 bg-success/10 p-6">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div className="text-right">
                  <h3 className="text-3xl font-bold text-success">KSh {todaysPaymentsTotal.toLocaleString()}</h3>
                  <p className="text-sm text-success/80 mt-1">Today's Payments</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div className="text-right">
                  <h3 className="text-3xl font-bold text-destructive">{highRiskCount}</h3>
                  <p className="text-sm text-destructive/80 mt-1">High Risk</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <Input
            placeholder="Search debtors..."
            className="mb-4 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setActiveFilter("All")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                activeFilter === "All"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("Active")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                activeFilter === "Active"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter("Overdue")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                activeFilter === "Overdue"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              Overdue
            </button>
            <button
              onClick={() => setActiveFilter("High Risk")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                activeFilter === "High Risk"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              High Risk
            </button>
            <button
              onClick={() => setActiveFilter("At Limit")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                activeFilter === "At Limit"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              At Limit
            </button>
          </div>
        </section>

        {/* Debtors List */}
        <section className="space-y-4 opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-6">Loading...</div>
          ) : filteredDebtors.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6">No debtors found.</div>
          ) : (
            filteredDebtors.map((debtor: any) => {
              const outstanding = Number(debtor.outstanding_balance ?? 0);
              const limit = Number(debtor.credit_limit ?? 0);
              const ratio = limit > 0 ? outstanding / limit : outstanding > 0 ? 1 : 0;
              const riskLabel = ratio >= 1 ? "HIGH" : ratio >= 0.8 ? "MEDIUM" : "LOW";
              const badgeClass = ratio >= 1 ? "badge-destructive" : ratio >= 0.8 ? "badge-warning" : "badge-success";

              return (
                <div
                  key={debtor.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/debtors/${debtor.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate(`/debtors/${debtor.id}`);
                  }}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info text-info-foreground font-bold text-lg">
                        {String(debtor.name ?? "?").charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{debtor.name}</h3>
                        <p className="text-sm text-muted-foreground">{debtor.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Available Credit</p>
                      <h4 className="text-lg font-bold text-success">
                        KSh {Math.max(0, limit - outstanding).toLocaleString()}
                      </h4>
                      <span className={cn("badge-status mt-1", badgeClass)}>{riskLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <AddDebtorModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onDebtorAdded={() => setAddOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Debtors;
