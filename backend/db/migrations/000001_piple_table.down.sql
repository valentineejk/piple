-- Reverse of 000001_piple_table.up.sql
-- Drop tables in reverse dependency order (children before parents).
-- Dropping a table also drops its indexes, foreign keys, and CHECK
-- constraints automatically. No enum types to drop (values are enforced
-- via text + CHECK on the columns instead).

DROP TABLE IF EXISTS "transactions";
DROP TABLE IF EXISTS "wallet_topups";
DROP TABLE IF EXISTS "payment_requests";
DROP TABLE IF EXISTS "payouts";
DROP TABLE IF EXISTS "wallets";
DROP TABLE IF EXISTS "employees";
DROP TABLE IF EXISTS "salary_codes";
DROP TABLE IF EXISTS "users";
