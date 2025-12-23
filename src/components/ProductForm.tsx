import { useForm } from 'react-hook-form';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const { categories, isAdding, addProduct, isUpdating, updateProduct } = useProducts();
  const isEditing = !!initialData;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category_id: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const productData = {
        ...data,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock_quantity, 10),
        category_id: data.category_id || null,
      };
      if (isEditing) {
        await updateProduct({ id: initialData.id, updates: productData });
      } else {
        await addProduct(productData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Product name is required' })}
          placeholder="Enter product name"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="Enter product description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (KSH) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' }
            })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            {...register('stock_quantity', {
              required: 'Stock quantity is required',
              min: { value: 0, message: 'Quantity must be positive' }
            })}
            placeholder="0"
          />
          {errors.stock_quantity && (
            <p className="text-sm text-red-500 mt-1">{errors.stock_quantity.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="category_id">Category</Label>
        <select
          id="category_id"
          {...register('category_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isAdding || isUpdating}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isAdding || isUpdating}>
          {(isAdding || isUpdating) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : isEditing ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}
