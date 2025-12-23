import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockAlert: number;
  images: string[];
  supplier: string;
  description: string;
  expiryDate?: string;
  batchNumber?: string;
}

interface Debtor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  currentDebt: number;
  dueDate?: string;
  notes?: string;
  paymentType: 'FULL' | 'INSTALLMENT' | 'CUSTOM';
  installmentAmount?: number;
  paymentFrequency?: string;
}

interface DataContextType {
  products: Product[];
  debtors: Debtor[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  addDebtor: (debtor: Omit<Debtor, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const addDebtor = (debtor: Omit<Debtor, 'id'>) => {
    const newDebtor: Debtor = {
      ...debtor,
      id: Date.now().toString(),
    };
    setDebtors(prev => [...prev, newDebtor]);
  };

  return (
    <DataContext.Provider value={{ products, debtors, addProduct, addDebtor }}>
      {children}
    </DataContext.Provider>
  );
};
