-- name: GetAllUsers :many
SELECT * FROM users
WHERE (sqlc.narg('role')::text IS NULL OR role = sqlc.narg('role'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;


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

-- name: SoftDeleteUser :one
UPDATE users
SET deleted_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: UpdateUserPassword :one
UPDATE users
SET password = $2
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (
  user_id,
  token_hash,
  expires_at
) VALUES (
  $1, $2, $3
)
RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at;

-- name: GetRefreshTokenByHash :one
SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
FROM refresh_tokens
WHERE token_hash = $1;

-- name: RevokeRefreshToken :one
UPDATE refresh_tokens
SET revoked_at = now()
WHERE token_hash = $1
  AND revoked_at IS NULL
RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at;