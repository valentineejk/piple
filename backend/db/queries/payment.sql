-- ============================================================
-- Wallet
-- ============================================================

-- name: CreateWallet :one
INSERT INTO wallets (currency)
VALUES (COALESCE(sqlc.narg('currency'), 'NGN'))
RETURNING *;

-- name: GetWallet :one
-- The system runs a single wallet; grab the earliest-created one.
SELECT * FROM wallets
ORDER BY created_at ASC
LIMIT 1;

-- name: GetWalletByID :one
SELECT * FROM wallets WHERE id = $1;

-- name: GetWalletForUpdate :one
-- Row-lock the wallet inside a transaction before mutating the balance.
SELECT * FROM wallets WHERE id = $1 FOR UPDATE;

-- name: CreditWallet :one
UPDATE wallets
SET balance = balance + sqlc.arg('amount'),
    updated_at = now()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DebitWallet :one
-- Atomic guarded debit: returns no row when funds are insufficient, so the
-- caller can treat pgx.ErrNoRows as "insufficient funds".
UPDATE wallets
SET balance = balance - sqlc.arg('amount'),
    updated_at = now()
WHERE id = sqlc.arg('id')
  AND balance >= sqlc.arg('amount')
RETURNING *;

-- ============================================================
-- Wallet top-ups (add money)
-- ============================================================

-- name: CreateWalletTopup :one
INSERT INTO wallet_topups (
  wallet_id, initiated_by, amount, status, channel, paystack_reference
) VALUES (
  $1, $2, $3, COALESCE(sqlc.narg('status'), 'pending'), sqlc.narg('channel'), sqlc.narg('paystack_reference')
)
RETURNING *;

-- name: GetWalletTopupByID :one
SELECT * FROM wallet_topups WHERE id = $1;

-- name: GetWalletTopupByReference :one
SELECT * FROM wallet_topups WHERE paystack_reference = $1;

-- name: MarkWalletTopupStatus :one
UPDATE wallet_topups
SET status = sqlc.arg('status'),
    channel = COALESCE(sqlc.narg('channel'), channel),
    completed_at = CASE WHEN sqlc.arg('status') IN ('success', 'failed') THEN now() ELSE completed_at END
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: ListWalletTopups :many
SELECT * FROM wallet_topups
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('initiated_by')::uuid IS NULL OR initiated_by = sqlc.narg('initiated_by'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountWalletTopups :one
SELECT COUNT(*) FROM wallet_topups
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('initiated_by')::uuid IS NULL OR initiated_by = sqlc.narg('initiated_by'));

-- ============================================================
-- Transactions (immutable ledger)
-- ============================================================

-- name: CreateTransaction :one
INSERT INTO transactions (
  wallet_id, user_id, payout_id, payment_request_id, amount, type, summary, provider
) VALUES (
  $1, $2, sqlc.narg('payout_id'), sqlc.narg('payment_request_id'), $3, $4, sqlc.narg('summary'), sqlc.narg('provider')
)
RETURNING *;

-- name: GetTransactionByID :one
SELECT * FROM transactions WHERE id = $1;

-- name: ListTransactions :many
SELECT * FROM transactions
WHERE (sqlc.narg('wallet_id')::uuid IS NULL OR wallet_id = sqlc.narg('wallet_id'))
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('type')::text IS NULL OR type = sqlc.narg('type'))
  AND (sqlc.narg('start')::timestamp IS NULL OR created_at >= sqlc.narg('start'))
  AND (sqlc.narg('end')::timestamp IS NULL OR created_at <= sqlc.narg('end'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountTransactions :one
SELECT COUNT(*) FROM transactions
WHERE (sqlc.narg('wallet_id')::uuid IS NULL OR wallet_id = sqlc.narg('wallet_id'))
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('type')::text IS NULL OR type = sqlc.narg('type'))
  AND (sqlc.narg('start')::timestamp IS NULL OR created_at >= sqlc.narg('start'))
  AND (sqlc.narg('end')::timestamp IS NULL OR created_at <= sqlc.narg('end'));

-- ============================================================
-- Payment requests (procurement -> CEO review)
-- ============================================================

-- name: CreatePaymentRequest :one
INSERT INTO payment_requests (
  requested_by, amount, description, bank_code, account_number, account_name
) VALUES (
  $1, $2, sqlc.narg('description'), sqlc.narg('bank_code'), sqlc.narg('account_number'), sqlc.narg('account_name')
)
RETURNING *;

-- name: GetPaymentRequestByID :one
SELECT * FROM payment_requests WHERE id = $1;

-- name: ListPaymentRequests :many
SELECT * FROM payment_requests
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('requested_by')::uuid IS NULL OR requested_by = sqlc.narg('requested_by'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPaymentRequests :one
SELECT COUNT(*) FROM payment_requests
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('requested_by')::uuid IS NULL OR requested_by = sqlc.narg('requested_by'));

-- name: ApprovePaymentRequest :one
-- Only a pending request can be approved (guards double-processing).
UPDATE payment_requests
SET status = 'approved',
    reviewed_by = sqlc.arg('reviewed_by'),
    reviewed_at = now(),
    updated_at = now()
WHERE id = sqlc.arg('id') AND status = 'pending'
RETURNING *;

-- name: RejectPaymentRequest :one
UPDATE payment_requests
SET status = 'rejected',
    rejection_reason = sqlc.arg('rejection_reason'),
    reviewed_by = sqlc.arg('reviewed_by'),
    reviewed_at = now(),
    updated_at = now()
WHERE id = sqlc.arg('id') AND status = 'pending'
RETURNING *;

-- ============================================================
-- Payouts (salary disbursement)
-- ============================================================

-- name: CreatePayout :one
INSERT INTO payouts (user_id, salary_code_id, amount, pay_period, status)
VALUES ($1, $2, $3, $4, COALESCE(sqlc.narg('status'), 'pending'))
RETURNING *;

-- name: GetPayoutByID :one
SELECT * FROM payouts WHERE id = $1;

-- name: GetPayoutByUserAndPeriod :one
-- Idempotency guard for the monthly batch.
SELECT * FROM payouts WHERE user_id = $1 AND pay_period = $2;

-- name: UpdatePayoutStatus :one
UPDATE payouts
SET status = sqlc.arg('status'),
    paid_at = CASE WHEN sqlc.arg('status') = 'completed' THEN now() ELSE paid_at END
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: ListPayouts :many
SELECT * FROM payouts
WHERE (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('pay_period')::date IS NULL OR pay_period = sqlc.narg('pay_period'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPayouts :one
SELECT COUNT(*) FROM payouts
WHERE (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('pay_period')::date IS NULL OR pay_period = sqlc.narg('pay_period'));

-- name: ListPayoutsByEmployee :many
-- An employee's own payout history (GET /employees/:id/payouts).
SELECT * FROM payouts
WHERE user_id = $1
ORDER BY pay_period DESC
LIMIT $2 OFFSET $3;

-- name: CountPayoutsByEmployee :one
SELECT COUNT(*) FROM payouts WHERE user_id = $1;
