import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, ScanLine, Image as ImageIcon, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
  productToEdit?: {
    id: string;
    name?: string | null;
    category?: string | null;
    sku?: string | null;
    barcode?: string | null;
    buying_price?: number | null;
    selling_price?: number | null;
    quantity?: number | null;
    low_stock_threshold?: number | null;
    unit?: string | null;
    description?: string | null;
    image_url?: string | null;
  } | null;
}
export function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
  productToEdit,
}: AddProductModalProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    barcode: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    lowStockAlert: 5,
    unit: 'pcs',
    images: [] as string[],
    supplier: '',
    description: '',
    expiryDate: '',
    batchNumber: '',
  });

  const isEditing = Boolean(productToEdit?.id);

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setSubmitting(false);

    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (productToEdit) {
      setImageFile(null);
      setImagePreviewUrl(productToEdit.image_url || null);
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || '',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        costPrice: Number(productToEdit.buying_price || 0),
        sellingPrice: Number(productToEdit.selling_price || 0),
        quantity: Number(productToEdit.quantity || 0),
        lowStockAlert: Number(
          typeof productToEdit.low_stock_threshold === 'number' ? productToEdit.low_stock_threshold : 5
        ),
        unit: productToEdit.unit || 'pcs',
        images: [] as string[],
        supplier: '',
        description: productToEdit.description || '',
        expiryDate: '',
        batchNumber: '',
      });
      return;
    }

    setImageFile(null);
    setImagePreviewUrl(null);
    setFormData({
      name: '',
      category: '',
      sku: '',
      barcode: '',
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      lowStockAlert: 5,
      unit: 'pcs',
      images: [] as string[],
      supplier: '',
      description: '',
      expiryDate: '',
      batchNumber: '',
    });
  }, [isOpen, productToEdit]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const skuInput = String(formData.sku || '').trim();

    const randomSuffix =
      typeof crypto !== 'undefined' &&
      'randomUUID' in crypto &&
      typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const sku = skuInput || (isEditing ? String(productToEdit?.sku || '').trim() : '') || `SKU-${randomSuffix}`;

    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('Not authenticated');
      }

      if (skuInput && (!isEditing || sku !== String(productToEdit?.sku || '').trim())) {
        const { data: existing, error: existingError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('sku', sku)
          .neq('id', isEditing ? productToEdit!.id : '00000000-0000-0000-0000-000000000000')
          .limit(1);

        if (existingError) {
          throw existingError;
        }

        if (existing && existing.length > 0) {
          toast({
            title: 'SKU already exists',
            description: 'This SKU is already used for another product. Change the SKU (or leave it empty to auto-generate a unique one).',
            variant: 'destructive',
          });
          return;
        }
      }

      let productId = productToEdit?.id;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            sku,
            barcode: formData.barcode || null,
            buying_price: Number(formData.costPrice),
            selling_price: Number(formData.sellingPrice),
            quantity: Number(formData.quantity),
            unit: formData.unit,
            low_stock_threshold: Number(formData.lowStockAlert),
          })
          .eq('id', productToEdit!.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert([
            {
              name: formData.name,
              description: formData.description,
              category: formData.category,
              category_id: null,
              sku,
              barcode: formData.barcode || null,
              buying_price: Number(formData.costPrice),
              selling_price: Number(formData.sellingPrice),
              quantity: Number(formData.quantity),
              unit: formData.unit,
              low_stock_threshold: Number(formData.lowStockAlert),
              image_url: null,
              user_id: user.id,
            },
          ])
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        productId = insertedProduct.id;
      }

      if (imageFile && productId) {
        try {
          const ext = imageFile.name.split('.').pop() || 'jpg';
          const filePath = `${user.id}/${productId}-${Date.now()}.${ext}`;
          const bucket = 'product-images';

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, imageFile, {
              upsert: true,
              contentType: imageFile.type,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          const publicUrl = data.publicUrl;

          const { error: updateImageError } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId);

          if (updateImageError) {
            throw updateImageError;
          }
        } catch (e: any) {
          console.error('Image upload failed:', e);

          const msg = String(e?.message || '');
          const isRls =
            msg.toLowerCase().includes('row-level security') ||
            msg.toLowerCase().includes('rls') ||
            e?.code === '42501';

          toast({
            title: 'Image upload failed',
            description:
              (isRls
                ? 'Product was saved, but updating image_url was blocked by RLS. Add a products UPDATE policy (auth.uid() = user_id).'
                : e?.message) ||
              'Product was saved, but the image could not be uploaded. Check Storage bucket and policies.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Success',
        description: isEditing ? 'Product updated successfully' : 'Product added successfully',
      });

      onProductAdded?.();
      onClose();
      setStep(1);
      setImageFile(null);
      if (imagePreviewUrl) {
        if (imagePreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreviewUrl);
        }
      }
      setImagePreviewUrl(null);
      setFormData({
        name: '',
        category: '',
        sku: '',
        barcode: '',
        costPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        lowStockAlert: 5,
        unit: 'pcs',
        images: [],
        supplier: '',
        description: '',
        expiryDate: '',
        batchNumber: '',
      });
    } catch (error: any) {
      console.error('Add product failed:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });

      if (error?.code === '23505') {
        toast({
          title: 'SKU already exists',
          description:
            'This SKU is already used for another product. Change the SKU (or leave it empty to auto-generate a unique one).',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Error',
        description:
          error?.message ||
          (error?.code ? `Error code: ${error.code}` : '') ||
          (typeof error === 'string' ? error : '') ||
          'Failed to add product',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Basic Information
            </h3>

            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="flex items-start space-x-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg w-40 h-40 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setImageFile(f);
                        if (imagePreviewUrl) {
                          URL.revokeObjectURL(imagePreviewUrl);
                        }
                        setImagePreviewUrl(f ? URL.createObjectURL(f) : null);
                      }}
                    />

                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Product"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <Plus className="h-8 w-8 mb-2" />
                        <span className="text-xs font-medium">Add Image</span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          Max 5MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Stored in Supabase Storage
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    placeholder="e.g., Coca-Cola 500ml"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option>Select Category</option>
                    <option>Beverages</option>
                    <option>Electronics</option>
                    <option>Groceries</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Auto-generated if left empty"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                      placeholder="Scan or enter manually"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700">
                      <ScanLine className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"
                  placeholder="Optional product description or notes"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                ></textarea>
              </div>
            </div>
          </>;
      case 2:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Pricing & Stock Information
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price (KSh) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How much you paid for this product
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (KSh) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    placeholder="0.00"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Price you sell to customers
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Quantity <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measure <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  >
                    <option>pcs</option>
                    <option>kg</option>
                    <option>liters</option>
                    <option>meters</option>
                    <option>boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="5"
                  value={formData.lowStockAlert}
                  onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this level
                </p>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="lowStockAlerts" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                <label htmlFor="lowStockAlerts" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Low Stock Alerts
                </label>
              </div>
            </div>
          </>;
      case 3:
        return <>
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Advanced Information
            </h3>

            <div className="space-y-6">
              {/* Suppliers Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Suppliers
                  </label>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Supplier
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <Building2 className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    No suppliers selected
                  </p>
                  <p className="text-xs text-gray-400">
                    Add suppliers to track pricing and manage relationships
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legacy Supplier{' '}
                    <span className="text-xs text-gray-400 font-normal">
                      (backward compatibility)
                    </span>
                  </label>
                  <input type="text" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g., ABC Distributors" />
                  <p className="text-xs text-gray-500 mt-1">
                    Use the enhanced supplier selection above instead
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Location
                  </label>
                  <input type="text" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g., Shelf A-1, Warehouse 2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input type="text" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="For tracking bulk purchases" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input type="date" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input type="text" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g., organic, imported, bestseller (comma separated)" />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="flex items-start">
                <input type="checkbox" id="perishable" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5" />
                <div className="ml-2">
                  <label htmlFor="perishable" className="text-sm font-medium text-gray-700 block">
                    This is a perishable item
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Check this for items that expire or go bad over time
                  </p>
                </div>
              </div>
            </div>
          </>;
      default:
        return null;
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-700 p-6 text-white relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-blue-100 hover:text-white hover:bg-blue-600 rounded-full p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-1">{isEditing ? 'Update Product' : 'Add New Product'}</h2>
          <p className="text-blue-100 text-sm mb-6">
            {isEditing ? 'Edit product details and save changes' : 'Create new inventory item with all details'}
          </p>

          {/* Steps */}
          <div className="flex items-center text-sm w-full">
            <div className="flex items-center flex-1">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 1 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                1
              </span>
              <span className={step >= 1 ? 'text-white font-medium' : 'text-blue-300'}>
                Basic Info
              </span>
              <div className={`h-px flex-1 mx-4 ${step >= 2 ? 'bg-blue-400' : 'bg-blue-800'}`}></div>
            </div>
            <div className="flex items-center flex-1">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 2 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                2
              </span>
              <span className={step >= 2 ? 'text-white font-medium' : 'text-blue-300'}>
                Pricing & Stock
              </span>
              <div className={`h-px flex-1 mx-4 ${step >= 3 ? 'bg-blue-400' : 'bg-blue-800'}`}></div>
            </div>
            <div className="flex items-center">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 3 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                3
              </span>
              <span className={step >= 3 ? 'text-white font-medium' : 'text-blue-300'}>
                Advanced
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">{renderStepContent()}</div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : null} disabled={step === 1}>
            Previous
          </Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={submitting}>
              {step < 3 ? 'Next' : 'Add Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>;
}