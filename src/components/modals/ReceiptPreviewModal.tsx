import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId?: string;
  saleData?: {
    receiptNumber: string;
    date: string;
    time: string;
    paymentMethod: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    total: number;
  };
}
export function ReceiptPreviewModal({
  isOpen,
  onClose,
  saleId,
  saleData
}: ReceiptPreviewModalProps) {
  if (!isOpen) return null;

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<ReceiptPreviewModalProps['saleData'] | null>(saleData ?? null);

  useEffect(() => {
    if (!isOpen) return;
    if (saleData) {
      setLoadedData(saleData);
      return;
    }
    if (!saleId) {
      setLoadedData(null);
      return;
    }

    const fetchReceipt = async () => {
      setLoading(true);
      try {
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .select('id, sale_number, payment_method, subtotal, total, created_at')
          .eq('id', saleId)
          .single();

        if (saleError) throw saleError;

        const { data: items, error: itemsError } = await supabase
          .from('sale_items')
          .select('product_name, quantity, unit_price, line_total')
          .eq('sale_id', saleId)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;

        const d = new Date(String((sale as any)?.created_at ?? new Date().toISOString()));
        const subtotal = Number((sale as any)?.subtotal ?? 0) || (items ?? []).reduce((s: number, r: any) => s + Number(r.line_total ?? 0), 0);
        const total = Number((sale as any)?.total ?? subtotal);
        const receiptNumber = String((sale as any)?.sale_number ?? (sale as any)?.id ?? '').trim();

        setLoadedData({
          receiptNumber: receiptNumber ? `#${receiptNumber}` : '#',
          date: d.toLocaleDateString(),
          time: d.toLocaleTimeString(),
          paymentMethod: String((sale as any)?.payment_method ?? 'Cash'),
          items: (items ?? []).map((it: any) => ({
            name: String(it.product_name ?? 'Item'),
            quantity: Number(it.quantity ?? 0),
            price: Number(it.unit_price ?? 0),
          })),
          subtotal,
          total,
        });
      } catch (error: any) {
        setLoadedData(null);
        toast({ title: 'Error', description: error?.message || 'Failed to load receipt', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    void fetchReceipt();
  }, [isOpen, saleData, saleId]);

  const handlePrint = () => {
    const el = receiptRef.current;
    if (!el) return;

    const win = window.open('', '_blank', 'width=520,height=720');
    if (!win) {
      toast({ title: 'Popup blocked', description: 'Please allow popups to print the receipt.', variant: 'destructive' });
      return;
    }

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; padding: 16px; }
            .receipt { max-width: 420px; margin: 0 auto; }
            .text-center { text-align: center; }
            .muted { color: #6b7280; }
            .row { display: flex; justify-content: space-between; gap: 12px; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .pt-4 { padding-top: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-3 { margin-bottom: 12px; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-lg { font-size: 18px; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="receipt">${el.innerHTML}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const defaultData = {
    receiptNumber: '#FED559BE',
    date: '21/12/2025',
    time: '12:49:24',
    paymentMethod: 'Cash',
    items: [{
      name: 'Test',
      quantity: 1,
      price: 11000
    }],
    subtotal: 11000,
    total: 11000
  };
  const data = loadedData || saleData || defaultData;
  const hasItems = useMemo(() => (data.items ?? []).length > 0, [data.items]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Receipt Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6" ref={receiptRef}>
          {/* Business Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Kaapoa</h3>
            <p className="text-sm text-gray-500">Sales Receipt</p>
            <p className="text-xs text-gray-400">
              {data.date}, {data.time}
            </p>
          </div>

          {/* Receipt Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-600">Receipt #:</span>
              <span className="font-medium text-gray-900">
                {data.receiptNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-gray-900">
                {data.paymentMethod}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Items:</h4>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : !hasItems ? (
              <div className="text-sm text-gray-500">No items</div>
            ) : data.items.map((item, index) => <div key={index} className="flex justify-between text-sm mb-2">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} x KSH {item.price.toLocaleString()}
                  </p>
                </div>
                <span className="font-bold text-gray-900">
                  KSH {(item.quantity * item.price).toLocaleString()}
                </span>
              </div>)}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                KSH {data.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">
                KSH {data.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center text-xs text-gray-500 mb-4">
            <p className="font-medium mb-1">Thank you for your business!</p>
            <p>Powered by Kaapoa</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
          <Button className="flex-1" onClick={handlePrint} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Skip
          </Button>
        </div>
      </div>
    </div>;
}