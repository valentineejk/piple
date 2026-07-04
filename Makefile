start:
	./backend/main.go .

# usage: make migrate-create name=create_users_table
migrate-create:
	migrate create -ext sql -dir ./backend/db/migrations -seq $(name)

migrate-up:
	migrate -path ./backend/db/migrations -database "postgres://postgres:password@localhost:5432/postgres?sslmode=disable" up

migrate-down:
	migrate -path ./backend/db/migrations -database "postgres://postgres:password@localhost:5432/postgres?sslmode=disable" down 1

sqlc:
	#generate sql commands
	sqlc generate
