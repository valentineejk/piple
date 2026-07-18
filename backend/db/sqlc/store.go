package dbq

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Store bundles the generated Queries with the connection pool so callers can
// run either single queries (via the embedded *Queries) or multi-statement
// atomic work (via ExecTx). This file is hand-written; db.go is generated.
type Store struct {
	*Queries
	pool *pgxpool.Pool
}

// NewStore builds a Store from a pgx pool.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{
		Queries: New(pool),
		pool:    pool,
	}
}

// ExecTx runs fn inside a single database transaction. Every query fn performs
// on the provided *Queries goes through the same transaction. If fn returns an
// error (or panics) the transaction is rolled back; otherwise it commits.
//
//	err := store.ExecTx(ctx, func(q *dbq.Queries) error {
//	    if _, err := q.DebitWallet(ctx, ...); err != nil {
//	        return err // rolls back
//	    }
//	    _, err := q.CreateTransaction(ctx, ...)
//	    return err
//	})

func (s *Store) ExecTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	// No-op if the tx was already committed; also unwinds a panic safely.
	defer tx.Rollback(ctx)

	if err := fn(s.Queries.WithTx(tx)); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
