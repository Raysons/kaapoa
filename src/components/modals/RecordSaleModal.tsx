import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus, Receipt, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
interface RecordSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordSale?: (saleId?: string) => void
}
export function RecordSaleModal({
  isOpen,
  onClose,
  onRecordSale,
}: RecordSaleModalProps) {
  const [products, setProducts] = useState<Array<{ id: string; name: string; selling_price: number; quantity: number }>>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa' | 'Bank Transfer' | 'Credit Card'>('Cash')
  const [taxRate, setTaxRate] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, selling_price, quantity')
        .order('name', { ascending: true })

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }
      setProducts(data ?? [])
    }
    fetchProducts()
  }, [isOpen])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  )

  useEffect(() => {
    if (!selectedProduct) return
    setUnitPrice(selectedProduct.selling_price ?? 0)
  }, [selectedProductId])

  const lineTotal = useMemo(() => (Number(quantity) || 0) * (Number(unitPrice) || 0), [quantity, unitPrice])
  const subtotal = lineTotal
  const taxAmount = (subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  const itemsCount = selectedProductId ? 1 : 0

  const handleRecordSale = async () => {
    if (!selectedProduct) return
    if (!selectedProductId) return
    if ((Number(quantity) || 0) <= 0) return

    setSubmitting(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      const saleNumber = `SALE-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.floor(
        Math.random() * 1000
      )}`

      const { data: saleRow, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            user_id: user?.id ?? null,
            sale_number: saleNumber,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            customer_email: customerEmail || null,
            payment_method: paymentMethod,
            tax_rate: taxRate,
            subtotal,
            tax_amount: taxAmount,
            total,
          },
        ])
        .select('id')
        .single()

      if (saleError) throw saleError

      const saleId = saleRow.id as string
      const { error: itemsError } = await supabase.from('sale_items').insert([
        {
          user_id: user?.id ?? null,
          sale_id: saleId,
          product_id: selectedProductId,
          product_name: selectedProduct.name,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          line_total: lineTotal,
        },
      ])

      if (itemsError) throw itemsError

      const newQty = (selectedProduct.quantity ?? 0) - Number(quantity)
      const { error: stockError } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', selectedProductId)

      if (stockError) throw stockError

      const { error: invTxError } = await supabase.from('inventory_transactions').insert([
        {
          user_id: user?.id ?? null,
          product_id: selectedProductId,
          transaction_type: 'sale',
          quantity: Number(quantity),
          reference_id: saleId,
          notes: `Sale ${saleNumber}`,
        },
      ])

      if (invTxError) {
        console.warn('Failed to record inventory transaction:', invTxError)
      }

      toast({ title: 'Success', description: 'Sale recorded successfully' })

      setSelectedProductId('')
      setQuantity(1)
      setUnitPrice(0)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setPaymentMethod('Cash')
      setTaxRate(0)

      onRecordSale?.(saleId)
      onClose()
    } catch (error: any) {
      console.error('Record sale failed:', error)
      toast({ title: 'Error', description: error?.message || 'Failed to record sale', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-blue-100 hover:text-white hover:bg-blue-500 rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <Receipt className="h-6 w-6" />
            <h2 className="text-xl font-bold">Record Sale</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Add one or more products/services to your transaction
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sale Items</h3>

          {/* Item Entry */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Item #1</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product/Service <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                  <option>Product</option>
                  <option>Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <select
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white mt-2"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option>Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (KSh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (KSh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Line Total
                </label>
                <input
                  type="text"
                  value={`KSh ${lineTotal}`}
                  readOnly
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-gray-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Notes
              </label>
              <textarea
                placeholder="Optional notes for this item..."
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-16 resize-none"
              ></textarea>
            </div>
          </div>

          <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center mb-6">
            <Plus className="h-5 w-5 mr-2" />
            Add Another Item
          </button>

          {/* Customer Information */}
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Customer Information (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+254 700 000 000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Payment Details */}
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Payment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option>Cash</option>
                <option>M-Pesa</option>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (KSh)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    defaultValue="0"
                    className="flex-1 rounded-l-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="bg-gray-100 border border-l-0 border-gray-300 px-3 py-2 text-sm text-gray-600 rounded-r-lg">
                    KSh
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Notes
            </label>
            <textarea
              placeholder="Optional notes for this sale..."
              className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-16 resize-none"
            ></textarea>
          </div>
        </div>

        {/* Footer with Summary */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1 mr-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Receipt className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-bold text-gray-900">
                  Sale Summary
                </span>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{itemsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">KSh {subtotal}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-blue-600 text-lg">
                  KSh {total}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRecordSale}
              disabled={submitting}
            >
              <Check className="h-4 w-4 mr-2" />
              Record Sale (KSh {total})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
