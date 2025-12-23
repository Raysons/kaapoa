// src/types/supplier.ts
export type SupplierStatus = 'active' | 'inactive' | 'pending';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId?: string;
  website?: string;
  categories: string[];
  status: SupplierStatus;
  paymentTerms: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}