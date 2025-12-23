import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/supabaseClient';
import { useToast } from '../components/ui/use-toast';

export function useProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => database.getProducts(),
  });

  // Get categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => database.getCategories(),
  });

  // Add product mutation
  const addProduct = useMutation({
    mutationFn: (product: any) => database.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      database.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: (id: string) => database.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    products,
    categories,
    isLoading,
    error,
    addProduct: addProduct.mutateAsync,
    isAdding: addProduct.isPending,
    updateProduct: updateProduct.mutateAsync,
    isUpdating: updateProduct.isPending,
    deleteProduct: deleteProduct.mutate,
    isDeleting: deleteProduct.isPending,
  };
}
