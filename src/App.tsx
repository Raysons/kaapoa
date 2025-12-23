import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "@/pages/Index";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Sales from "@/pages/Sales";
import SalesDetails from "@/pages/SalesDetails";
import SalesHistory from "@/pages/SalesHistory";
import Expenses from "@/pages/Expenses";
import Debtors from "@/pages/Debtors";
import DebtorDetails from "@/pages/DebtorDetails";
import Products from "@/pages/Products";
import BrowseProducts from "@/pages/BrowseProducts";
import ProductDetails from "@/pages/ProductDetails";
import BulkUpload from "@/pages/BulkUpload";
import ProductsPage from "@/pages/ProductsPage";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Suppliers from "@/pages/Suppliers";
import Performance from "@/pages/Performance";

import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/:id" element={<SalesDetails />} />
              <Route path="/dashboard/sales/history" element={<SalesHistory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/debtors" element={<Debtors />} />
              <Route path="/debtors/:id" element={<DebtorDetails />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/browse" element={<BrowseProducts />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/add-product" element={<Navigate to="/products" replace />} />
              <Route path="/products/add" element={<Navigate to="/products" replace />} />
              <Route path="/products/bulk-upload" element={<BulkUpload />} />
              <Route path="/products/page" element={<ProductsPage />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Navigate to="/profile" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
