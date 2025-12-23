import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Edit, Trash2, Download, User, Calendar, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const SalesDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaleDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch sale details
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();

      if (saleError) throw saleError;

      // Fetch sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", id)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      setSale(saleData);
      setSaleItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load sale details", 
        variant: "destructive" 
      });
      navigate("/sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast({ title: "Info", description: "Edit functionality coming soon" });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete sale items first
      const { error: itemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", id);

      if (itemsError) throw itemsError;

      // Delete sale
      const { error: saleError } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);

      if (saleError) throw saleError;

      toast({ title: "Success", description: "Sale deleted successfully" });
      navigate("/sales");
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete sale", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Sale Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!sale) {
    return (
      <DashboardLayout title="Sale Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sale not found</p>
          <Button onClick={() => navigate("/sales")} className="mt-4">
            Back to Sales
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Sale #${sale.sale_number}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate("/sales")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Sale Information Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sale Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{sale.customer_name || "Guest"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {new Date(sale.created_at).toLocaleDateString()} • {new Date(sale.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg text-success">KSH {Number(sale.total || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{sale.payment_method || "Cash"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Items */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Items Sold</h3>
          
          {saleItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No items found for this sale</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border font-medium text-sm">
                <div>Product</div>
                <div className="text-center">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
              </div>
              
              {saleItems.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-border/50">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                    )}
                  </div>
                  <div className="text-center">
                    {Number(item.quantity || 0)}
                  </div>
                  <div className="text-right">
                    KSH {Number(item.unit_price || 0).toLocaleString()}
                  </div>
                  <div className="text-right font-medium">
                    KSH {Number(item.line_total || 0).toLocaleString()}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-xl font-bold text-success">
                    KSH {Number(sale.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {sale.notes && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Notes</h3>
            <p className="text-muted-foreground">{sale.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalesDetails;
