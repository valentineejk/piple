-- name: CreateUser :one
INSERT INTO users (first_name, last_name, email, password, role)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateUser :one
-- Partial update: unset (nil) args keep the existing value. Password is
-- excluded — that's UpdateUserPassword's job.
UPDATE users
SET
  first_name = COALESCE(sqlc.narg('first_name'), first_name),
  last_name  = COALESCE(sqlc.narg('last_name'), last_name),
  email      = COALESCE(sqlc.narg('email'), email),
  role       = COALESCE(sqlc.narg('role'), role)
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;

-- name: GetAllUsers :many
SELECT * FROM users
WHERE deleted_at IS NULL
  AND (sqlc.narg('role')::text IS NULL OR role = sqlc.narg('role'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: SoftDeleteUser :one
UPDATE users
SET deleted_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;