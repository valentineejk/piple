-- CREATE TYPE "user_role" AS ENUM (
--   'employee',
--   'procurement',
--   'ceo',
--   'admin'
-- );
--
-- CREATE TYPE "employee_status" AS ENUM (
--   'active',
--   'inactive',
--   'terminated',
--   'on_leave'
-- );
--
-- CREATE TYPE "payout_status" AS ENUM (
--   'pending',
--   'processing',
--   'completed',
--   'failed',
--   'insufficient_funds'
-- );
--
-- CREATE TYPE "payment_request_status" AS ENUM (
--   'pending',
--   'approved',
--   'rejected'
-- );
--
-- CREATE TYPE "transaction_type" AS ENUM (
--   'credit',
--   'debit'
-- );
--
-- CREATE TYPE "topup_status" AS ENUM (
--   'pending',
--   'success',
--   'failed'
-- );

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "role" text NOT NULL DEFAULT 'employee' CHECK ("role" IN ('employee', 'procurement', 'ceo', 'admin')),
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'terminated', 'on_leave')),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "employees" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid UNIQUE NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "dial_code" text NOT NULL,
  "phone" text NOT NULL,
  "resume" text,
  "country" text,
  "address" text,
  "state" text,
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'terminated', 'on_leave')),
  "level" text,
  "salary_code_id" uuid NOT NULL,
  "department" varchar,
  "bank_name" text,
  "bank_code" text,
  "account_number" text,
  "hired_at" timestamp,
  "updated_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "salary_codes" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "code" text UNIQUE NOT NULL,
  "level" text NOT NULL,
  "amount" bigint NOT NULL
);

CREATE TABLE "payouts" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "salary_code_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'insufficient_funds')),
  "pay_period" date NOT NULL,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "payment_requests" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "requested_by" uuid NOT NULL,
  "reviewed_by" uuid,
  "amount" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "description" text,
  "rejection_reason" text,
  "bank_code" text,
  "account_number" text,
  "account_name" text,
  "reviewed_at" timestamp,
  "updated_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "wallets" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "currency" text NOT NULL DEFAULT 'NGN',
  "balance" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "wallet_topups" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "wallet_id" uuid NOT NULL,
  "initiated_by" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'success', 'failed')),
  "channel" text,
  "paystack_reference" text UNIQUE,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "wallet_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "payout_id" uuid,
  "payment_request_id" uuid,
  "amount" bigint NOT NULL,
  "type" text NOT NULL CHECK ("type" IN ('credit', 'debit')),
  "summary" text,
  "provider" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE INDEX ON "users" ("email");

CREATE INDEX ON "users" ("role");

CREATE INDEX ON "employees" ("user_id");

CREATE INDEX ON "employees" ("salary_code_id");

CREATE INDEX ON "employees" ("department");

CREATE INDEX ON "salary_codes" ("code");

CREATE INDEX ON "salary_codes" ("level");

CREATE INDEX ON "payouts" ("user_id");

CREATE INDEX ON "payouts" ("salary_code_id");

CREATE INDEX ON "payouts" ("status");

CREATE UNIQUE INDEX ON "payouts" ("user_id", "pay_period");

CREATE INDEX ON "payment_requests" ("requested_by");

CREATE INDEX ON "payment_requests" ("reviewed_by");

CREATE INDEX ON "payment_requests" ("status");

CREATE INDEX ON "wallet_topups" ("wallet_id");

CREATE INDEX ON "wallet_topups" ("initiated_by");

CREATE INDEX ON "wallet_topups" ("status");

CREATE INDEX ON "wallet_topups" ("paystack_reference");

CREATE INDEX ON "transactions" ("wallet_id");

CREATE INDEX ON "transactions" ("user_id");

CREATE INDEX ON "transactions" ("payout_id");

CREATE INDEX ON "transactions" ("payment_request_id");

CREATE INDEX ON "transactions" ("type");

COMMENT ON COLUMN "employees"."bank_code" IS 'Paystack bank code';

COMMENT ON COLUMN "payouts"."pay_period" IS 'first day of the paid month, e.g. 2026-07-01';

COMMENT ON COLUMN "payment_requests"."requested_by" IS 'procurement team member, FK users.id';

COMMENT ON COLUMN "payment_requests"."reviewed_by" IS 'CEO who approved/rejected, FK users.id';

COMMENT ON COLUMN "payment_requests"."bank_code" IS 'Paystack bank code';

COMMENT ON COLUMN "wallets"."balance" IS 'internal ledger balance, source of truth for available funds before disbursing';

COMMENT ON COLUMN "wallet_topups"."initiated_by" IS 'CEO/admin who funded the wallet, FK users.id';

COMMENT ON COLUMN "wallet_topups"."channel" IS 'card, bank_transfer, ussd, etc.';

COMMENT ON COLUMN "wallet_topups"."paystack_reference" IS 'reference used for Initialize Transaction / Verify Transaction';

ALTER TABLE "employees" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employees" ADD FOREIGN KEY ("salary_code_id") REFERENCES "salary_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payouts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payouts" ADD FOREIGN KEY ("salary_code_id") REFERENCES "salary_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "wallet_topups" ADD FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "wallet_topups" ADD FOREIGN KEY ("initiated_by") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payment_requests" ADD FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payment_requests" ADD FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("payout_id") REFERENCES "payouts" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("payment_request_id") REFERENCES "payment_requests" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
