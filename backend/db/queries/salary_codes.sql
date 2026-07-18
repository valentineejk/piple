-- name: CreateSalaryCode :one
INSERT INTO salary_codes (code, level, amount)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSalaryCodeByID :one
SELECT * FROM salary_codes WHERE id = $1;

-- name: GetSalaryCodeByCode :one
SELECT * FROM salary_codes WHERE code = $1;

-- name: ListSalaryCodes :many
SELECT * FROM salary_codes
WHERE (sqlc.narg('level')::text IS NULL OR level = sqlc.narg('level'))
ORDER BY level ASC, amount DESC
LIMIT $1 OFFSET $2;

-- name: CountSalaryCodes :one
SELECT COUNT(*) FROM salary_codes
WHERE (sqlc.narg('level')::text IS NULL OR level = sqlc.narg('level'));

-- name: UpdateSalaryCode :one
UPDATE salary_codes
SET
  level  = COALESCE(sqlc.narg('level'), level),
  amount = COALESCE(sqlc.narg('amount'), amount)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: CountEmployeesBySalaryCode :one
SELECT COUNT(*) FROM employees WHERE salary_code_id = $1;

-- name: DeleteSalaryCode :one
DELETE FROM salary_codes WHERE id = $1
RETURNING id;
