import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalTitle } from '@/components/ui/modal';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleAdded: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, onSaleAdded }) => {
  const [saleNumber, setSaleNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const addItem = () => {
    setItems([...items, { product_id: '', product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      notifyError('Add at least one sale item');
      return;
    }

    setLoading(true);

    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const discount = 0;
    const tax = 0;
    const total = subtotal - discount + tax;

    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { data: sale, error: saleError } = await supabase.from('sales').insert([
      {
        user_id: userId,
        sale_number: saleNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal,
        discount,
        tax,
        total,
        payment_method: paymentMethod,
        status: 'completed',
        notes,
      },
    ]).select().single();

    if (saleError || !sale) {
      notifyError(saleError?.message || 'Failed to create sale');
      setLoading(false);
      return;
    }

    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

    if (itemsError) {
      notifyError(itemsError.message);
      setLoading(false);
      return;
    }

    notifySuccess('Sale recorded successfully');
    setLoading(false);
    onSaleAdded();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Record New Sale</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <Label htmlFor="saleNumber">Sale Number</Label>
              <Input
                id="saleNumber"
                value={saleNumber}
                onChange={e => setSaleNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div>
              <Label>Sale Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Product Name"
                    value={item.product_name}
                    onChange={e => updateItem(index, 'product_name', e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                    min={1}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                    min={0}
                    step={0.01}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Total Price"
                    value={item.total_price}
                    readOnly
                  />
                  <Button type="button" onClick={() => removeItem(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={addItem} className="mt-2">
                Add Item
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Sale'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
