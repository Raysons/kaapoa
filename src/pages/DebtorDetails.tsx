import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trash2, Phone, Mail, MapPin, CheckCircle2, Wallet, CreditCard } from "lucide-react";

const DebtorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [debtor, setDebtor] = useState<any | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  const financials = useMemo(() => {
    const outstanding = Number(debtor?.outstanding_balance ?? 0);
    const limit = Number(debtor?.credit_limit ?? 0);
    const available = Math.max(0, limit - outstanding);
    const ratio = limit > 0 ? outstanding / limit : outstanding > 0 ? 1 : 0;
    const riskLabel = ratio >= 1 ? "HIGH" : ratio >= 0.8 ? "MEDIUM" : "LOW";
    const badgeClass = ratio >= 1 ? "badge-destructive" : ratio >= 0.8 ? "badge-warning" : "badge-success";
    return { outstanding, limit, available, riskLabel, badgeClass };
  }, [debtor]);

  useEffect(() => {
    const fetchDebtor = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from("debtors").select("*").eq("id", id).single();
      setLoading(false);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setDebtor(null);
        return;
      }

      setDebtor(data);
    };

    fetchDebtor();
  }, [id]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!id) return;
      setPaymentsLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_method, reference_number, notes, created_at")
        .eq("debtor_id", id)
        .order("created_at", { ascending: false });
      setPaymentsLoading(false);

      if (error) {
        setPayments([]);
        return;
      }

      setPayments(data ?? []);
    };

    fetchPayments();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const ok = window.confirm("Delete this debtor? This action cannot be undone.");
    if (!ok) return;

    const { error } = await supabase.from("debtors").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Debtor deleted successfully." });
    navigate("/debtors");
  };

  if (loading) {
    return (
      <DashboardLayout title="Debtor Details">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!debtor) {
    return (
      <DashboardLayout title="Debtor Details">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">Debtor not found.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Debtor Details">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between opacity-0 animate-fade-up">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground">Debtor Details</h2>
              <p className="text-sm text-muted-foreground">{String(debtor?.name ?? "")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success font-bold shrink-0">
                {String(debtor.name ?? "?").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">{debtor.name}</p>
                <p className="text-xs text-muted-foreground truncate">{debtor.phone || debtor.email || ""}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <span className={cn("badge-status", financials.badgeClass)}>{financials.riskLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <div className="mx-auto w-fit rounded-lg bg-warning/15 p-2 mb-2">
                <Wallet className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm font-bold text-warning">KSH {financials.outstanding.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Current Debt</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <div className="mx-auto w-fit rounded-lg bg-info/15 p-2 mb-2">
                <CreditCard className="h-5 w-5 text-info" />
              </div>
              <p className="text-sm font-bold text-info">KSH {financials.limit.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Credit Limit</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <div className="mx-auto w-fit rounded-lg bg-success/15 p-2 mb-2">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm font-bold text-success">KSH {financials.available.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Available Credit</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
          {financials.outstanding <= 0 ? (
            <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
              No outstanding debt
            </div>
          ) : (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              Outstanding balance available
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
              <div className="rounded-lg bg-info/15 p-2">
                <Phone className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{debtor.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
              <div className="rounded-lg bg-success/15 p-2">
                <Mail className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{debtor.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
              <div className="rounded-lg bg-warning/15 p-2">
                <MapPin className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-foreground">{debtor.address || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Payment History</h3>
            <p className="text-xs text-muted-foreground">{paymentsLoading ? "..." : `${payments.length} payments`}</p>
          </div>

          {paymentsLoading ? (
            <div className="rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No Payment History</p>
              <p className="text-xs text-muted-foreground mt-1">Payment history will appear here once payments are made</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-muted/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">KSH {Number(p.amount ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{String(p.payment_method ?? "")} {p.reference_number ? `• ${p.reference_number}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DebtorDetails;
