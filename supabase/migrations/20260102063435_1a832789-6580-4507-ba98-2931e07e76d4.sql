-- Migration: Change table_number in orders from integer to text
ALTER TABLE orders ALTER COLUMN table_number TYPE text USING table_number::text;