-- name: CreateEmployee :one
INSERT INTO employees (
  user_id, first_name, last_name, dial_code, phone, resume, country,
  address, state, level, salary_code_id, department, bank_name,
  bank_code, account_number, hired_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
RETURNING *;

-- name: GetEmployeeByUserID :one
SELECT * FROM employees WHERE user_id = $1;

-- name: UpdateEmployee :one
UPDATE employees SET
  first_name = COALESCE(sqlc.narg('first_name'), first_name),
  last_name = COALESCE(sqlc.narg('last_name'), last_name),
  dial_code = COALESCE(sqlc.narg('dial_code'), dial_code),
  phone = COALESCE(sqlc.narg('phone'), phone),
  resume = COALESCE(sqlc.narg('resume'), resume),
  country = COALESCE(sqlc.narg('country'), country),
  address = COALESCE(sqlc.narg('address'), address),
  state = COALESCE(sqlc.narg('state'), state),
  status = COALESCE(sqlc.narg('status'), status),
  level = COALESCE(sqlc.narg('level'), level),
  salary_code_id = COALESCE(sqlc.narg('salary_code_id'), salary_code_id),
  department = COALESCE(sqlc.narg('department'), department),
  bank_name = COALESCE(sqlc.narg('bank_name'), bank_name),
  bank_code = COALESCE(sqlc.narg('bank_code'), bank_code),
  account_number = COALESCE(sqlc.narg('account_number'), account_number),
  hired_at = COALESCE(sqlc.narg('hired_at'), hired_at),
  updated_at = now()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteEmployee :one
DELETE FROM employees WHERE id = $1
RETURNING id;
