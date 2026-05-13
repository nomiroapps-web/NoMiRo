-- Add locale and currency settings to families table
ALTER TABLE public.families 
ADD COLUMN currency_code TEXT DEFAULT 'USD',
ADD COLUMN currency_symbol TEXT DEFAULT '$',
ADD COLUMN locale TEXT DEFAULT 'en-US';