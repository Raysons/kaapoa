import { api } from './api';
import { Supplier, SupplierPerformance, SupplierOrderStats } from '@/types/supplier';

class SupplierService {
  private basePath = '/suppliers';

  // Get all suppliers with optional search and filters
  async getSuppliers(params?: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Supplier[]; total: number }> {
    return api.get(this.basePath, { params });
  }

  // Get a single supplier by ID
  async getSupplier(id: string): Promise<Supplier> {
    return api.get(`${this.basePath}/${id}`);
  }

  // Create a new supplier
  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    return api.post(this.basePath, supplier);
  }

  // Update an existing supplier
  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    return api.put(`${this.basePath}/${id}`, supplier);
  }

  // Delete a supplier
  async deleteSupplier(id: string): Promise<void> {
    return api.delete(`${this.basePath}/${id}`);
  }

  // Get supplier performance metrics
  async getSupplierPerformance(id: string): Promise<SupplierPerformance> {
    return api.get(`${this.basePath}/${id}/performance`);
  }

  // Get supplier order statistics
  async getSupplierOrderStats(id: string): Promise<SupplierOrderStats> {
    return api.get(`${this.basePath}/${id}/stats/orders`);
  }

  // Search suppliers by name, contact, or other fields
  async searchSuppliers(query: string): Promise<Supplier[]> {
    return api.get(`${this.basePath}/search`, { params: { q: query } });
  }
}

export const supplierService = new SupplierService();
