.PHONY: start dev backend frontend install install-frontend build-frontend

# Run the Go API server (http://localhost:8080)
backend:
	cd backend && go run .

# alias kept for backwards compatibility
start: backend

# Run the Vite dev server (http://localhost:5173)
frontend:
	cd web && npm run dev

# Run backend and frontend together in parallel.
# Ctrl-C stops both.
dev:
	@$(MAKE) -j2 backend frontend

# Install all dependencies
install: install-frontend
	cd backend && go mod download

install-frontend:
	cd web && npm install

# Production build of the frontend
build-frontend:
	cd web && npm run build

# usage: make migrate-create name=create_users_table
migrate-create:
	migrate create -ext sql -dir ./backend/db/migrations -seq $(name)

migrate-up:
	migrate -path ./backend/db/migrations -database "postgres://postgres:password@localhost:5432/postgres?sslmode=disable" up

migrate-down:
	migrate -path ./backend/db/migrations -database "postgres://postgres:password@localhost:5432/postgres?sslmode=disable" down 1

sqlc:
	# Generate SQL commands
	sqlc generate