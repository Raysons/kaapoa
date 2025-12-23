-- supabase/migrations/20231222210000_initial_schema.sql
-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  barcode VARCHAR(100),
  sku VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Create debtors table
CREATE TABLE public.debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  outstanding_balance DECIMAL(12, 2) DEFAULT 0,
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  debtor_id UUID REFERENCES public.debtors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_id UUID REFERENCES public.debtors(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Create inventory_transactions table
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  quantity INTEGER NOT NULL,
  reference_id UUID, -- Can reference sales, purchases, or adjustments
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
-- Create policies for categories
CREATE POLICY "Users can view their own categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Create policies for products
CREATE POLICY "Users can view their own products"
ON public.products
FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products"
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Create policies for debtors
CREATE POLICY "Users can view their own debtors"
ON public.debtors
FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own debtors"
ON public.debtors
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create policies for sales
CREATE POLICY "Users can view their own sales"
ON public.sales
FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sales"
ON public.sales
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create policies for sale_items
CREATE POLICY "Users can view their own sale items"
ON public.sale_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.sales 
  WHERE sales.id = sale_items.sale_id 
  AND sales.user_id = auth.uid()
));
-- Create policies for expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses
FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create policies for payments
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payments"
ON public.payments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create policies for inventory_transactions
CREATE POLICY "Users can view their own inventory transactions"
ON public.inventory_transactions
FOR SELECT
USING (auth.uid() = user_id);
-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_debtors_user_id ON public.debtors(user_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_debtor_id ON public.sales(debtor_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_payments_debtor_id ON public.payments(debtor_id);
CREATE INDEX idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW; 
END;
$$ LANGUAGE plpgsql;
-- Create triggers to update updated_at
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_debtors_modtime
BEFORE UPDATE ON public.debtors
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_sales_modtime
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_sale_items_modtime
BEFORE UPDATE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_expenses_modtime
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
-- Create a function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS TRIGGER AS $$
DECLARE
    invoice_number TEXT;
    invoice_date TEXT;
    seq_num INTEGER;
BEGIN
    -- Format: INV-YYYYMMDD-XXXX
    invoice_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next sequence number for the day
    SELECT COALESCE(MAX(SUBSTRING(invoice_number, 14)::INTEGER), 0) + 1 
    INTO seq_num
    FROM public.sales
    WHERE invoice_number LIKE 'INV-' || invoice_date || '-%'
    AND user_id = NEW.user_id;
    
    -- Format the sequence number with leading zeros
    NEW.invoice_number := 'INV-' || invoice_date || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for invoice number generation
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.sales
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();
-- Create a function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock based on transaction type
    IF TG_OP = 'INSERT' THEN
        IF NEW.transaction_type = 'purchase' OR NEW.transaction_type = 'return' THEN
            UPDATE public.products 
            SET stock_quantity = stock_quantity + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_id;
        ELSIF NEW.transaction_type = 'sale' THEN
            UPDATE public.products 
            SET stock_quantity = stock_quantity - NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for inventory updates
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();
-- Create a function to update debtor balance
CREATE OR REPLACE FUNCTION update_debtor_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update debtor's outstanding balance when a new sale is added
        UPDATE public.debtors
        SET outstanding_balance = outstanding_balance + NEW.total_amount,
            updated_at = NOW()
        WHERE id = NEW.debtor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for debtor balance updates
CREATE TRIGGER trigger_update_debtor_balance
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION update_debtor_balance();
-- Create a function to update debtor balance when payment is made
CREATE OR REPLACE FUNCTION update_debtor_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update debtor's outstanding balance when a payment is made
        UPDATE public.debtors
        SET outstanding_balance = outstanding_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.debtor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for payment updates
CREATE TRIGGER trigger_update_debtor_balance_on_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_debtor_balance_on_payment();
