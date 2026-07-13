package handler

import (
	"github.com/gin-gonic/gin"
	dbq "github.com/valentineejk/piple/db/sqlc"
)

type Handler struct {
	queries *dbq.Queries
}

func New(queries *dbq.Queries) *Handler {
	return &Handler{
		queries: queries,
	}
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status": "ok",
	})
}
