-- Drop existing policies for products and services tables
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

-- Create new policies for products
-- Allow anyone to view products (no role check)
CREATE POLICY "Anyone can view products" ON public.products 
    FOR SELECT USING (true);

-- Allow only admins to modify products
CREATE POLICY "Only admins can modify products" ON public.products 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create new policies for services
-- Allow anyone to view services (no role check)
CREATE POLICY "Anyone can view services" ON public.services 
    FOR SELECT USING (true);

-- Allow only admins to modify services
CREATE POLICY "Only admins can modify services" ON public.services 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
