-- Test user seed
--   email:    test@aol.com
--   password: 123@abc   (bcrypt, cost 14 — matches helpers.HashPassword)
--
-- Role is 'admin' so the account can exercise every screen in the web app.
-- Change 'admin' to employee/procurement/ceo if you need a different role.
--
-- Run: psql "$DATABASE_URL" -f backend/db/seed_test_user.sql

INSERT INTO users (first_name, last_name, email, password, role, status)
VALUES (
  'Test',
  'User',
  'test@aol.com',
  '$2a$14$UvE2CV.c3Db72DAQVtQuFeGPtcVSLVv2k7zIuV7nKkM8DpfsJN5NG',
  'admin',
  'active'
)
ON CONFLICT (email) DO UPDATE
  SET password = EXCLUDED.password,
      role     = EXCLUDED.role,
      status   = EXCLUDED.status;
