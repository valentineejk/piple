-- name: CreateUser :one
INSERT INTO users (
  first_name,
  last_name,
  email,
  password,
  role
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING id, first_name, last_name, email, password, role, created_at;

-- name: GetUserByID :one
SELECT id, first_name, last_name, email, password, role, created_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, first_name, last_name, email, password, role, created_at
FROM users
WHERE email = $1;

-- name: UpdateUserPassword :one
UPDATE users
SET password = $2
WHERE id = $1
RETURNING id, first_name, last_name, email, password, role, created_at;

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
