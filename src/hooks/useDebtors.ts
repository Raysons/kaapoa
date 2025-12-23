import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/supabaseClient';

export function useDebtors() {
  const queryClient = useQueryClient();

  const { data: debtors = [], isLoading, error } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => database.getDebtors(),
  });

  const addDebtorMutation = useMutation({
    mutationFn: (debtorData: any) => database.addDebtor(debtorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });

  return {
    debtors,
    isLoading,
    error,
    addDebtor: addDebtorMutation.mutateAsync,
    isAdding: addDebtorMutation.isPending,
  };
}
