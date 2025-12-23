import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper functions for database operations
export const database = {
  // Products
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getProduct: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createProduct: async (product: Omit<Database['public']['Tables']['products']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...product,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  updateProduct: async (id: string, updates: Partial<Database['public']['Tables']['products']['Update']>) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  createCategory: async (category: Omit<Database['public']['Tables']['categories']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Debtors
  getDebtors: async () => {
    const { data, error } = await supabase
      .from('debtors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  addDebtor: async (debtorData: Omit<Database['public']['Tables']['debtors']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('debtors')
      .insert([{
        ...debtorData,
        user_id: userData.user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateDebtor: async (id: string, updates: Partial<Database['public']['Tables']['debtors']['Update']>) => {
    const { data, error } = await supabase
      .from('debtors')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteDebtor: async (id: string) => {
    const { error } = await supabase
      .from('debtors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  addDebtorPaymentTerms: async (terms: {
    debtor_id: string;
    payment_type: string;
    installment_amount?: number | null;
    payment_frequency?: string | null;
    custom_schedule?: any;
  }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('debtor_payment_terms')
      .insert([
        {
          ...terms,
          user_id: userData.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
