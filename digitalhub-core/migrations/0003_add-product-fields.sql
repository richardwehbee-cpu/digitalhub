ALTER TABLE products ADD COLUMN category TEXT;
ALTER TABLE products ADD COLUMN image TEXT;
ALTER TABLE products ADD COLUMN cost_price REAL;
ALTER TABLE products ADD COLUMN profit_percent REAL DEFAULT 30;
ALTER TABLE products ADD COLUMN discount_percent REAL DEFAULT 0;
ALTER TABLE products ADD COLUMN region TEXT;
ALTER TABLE products ADD COLUMN delivery_type TEXT;