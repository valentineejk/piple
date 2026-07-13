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
RETURNING *;


-- name: GetUserByID :one
SELECT id, first_name, last_name, email, password, role, created_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, first_name, last_name, email, password, role, created_at
FROM users
WHERE email = $1;

-- name: GetallUsers :many
SELECT * FROM users
WHERE (sqlc.narg('role')::text IS NULL OR role = sqlc.narg('role'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;


