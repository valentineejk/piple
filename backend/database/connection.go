package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/valentineejk/piple/db/sqlc"
)

func Connection() (*dbq.Queries, *pgxpool.Pool) {

	DATABASE_URL := os.Getenv("DATABASE_URL")

	// pgxpool manages a pool of connections
	pool, err := pgxpool.New(context.Background(), DATABASE_URL)
	if err != nil {
		log.Fatalf("cannot connect to database: %v", err)
	}

	// ping to verify connection is alive at startup
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		log.Fatalf("database ping failed: %v", err)
	}
	fmt.Println("connected to postgres")

	// db.New wraps the pool and gives us typed query methods
	queries := dbq.New(pool)

	return queries, pool
}
