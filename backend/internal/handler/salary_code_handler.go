package handler

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	dbq "github.com/valentineejk/piple/db/sqlc"
	"github.com/valentineejk/piple/internal/helpers"
	"github.com/valentineejk/piple/internal/model"
)

func toSalaryCodeResponse(s dbq.SalaryCode) model.SalaryCodeResponse {
	return model.SalaryCodeResponse{
		ID:     helpers.UUIDToString(s.ID),
		Code:   s.Code,
		Level:  s.Level,
		Amount: s.Amount,
	}
}

// CreateSalaryCode provisions a new salary code with a server-generated nano id.
func (h *Handler) CreateSalaryCode(c *gin.Context) {
	var req model.CreateSalaryCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	// Retry on the (extremely unlikely) event of a code collision.
	var created dbq.SalaryCode
	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		code, err := helpers.GenerateSalaryCode()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"message": "failed to generate salary code",
			})
			return
		}

		created, lastErr = h.queries.CreateSalaryCode(c.Request.Context(), dbq.CreateSalaryCodeParams{
			Code:   code,
			Level:  req.Level,
			Amount: req.Amount,
		})
		if lastErr == nil {
			c.JSON(http.StatusCreated, gin.H{
				"data":    toSalaryCodeResponse(created),
				"message": "salary code created successfully",
			})
			return
		}

		var pgErr *pgconn.PgError
		if errors.As(lastErr, &pgErr) && pgErr.Code == pgUniqueViolation {
			continue // regenerate and try again
		}
		break // non-collision error, stop retrying
	}

	c.JSON(http.StatusInternalServerError, gin.H{
		"error":   lastErr.Error(),
		"message": "failed to create salary code",
	})
}

// GetAllSalaryCodes lists salary codes, optionally filtered by level, paginated.
func (h *Handler) GetAllSalaryCodes(c *gin.Context) {
	var levelPtr *string
	if level := c.Query("level"); level != "" {
		levelPtr = &level
	}

	page, limit := 1, 25
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	if limit > 50 {
		limit = 50
	}

	total, err := h.queries.CountSalaryCodes(c.Request.Context(), levelPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to count salary codes",
		})
		return
	}

	rows, err := h.queries.ListSalaryCodes(c.Request.Context(), dbq.ListSalaryCodesParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
		Level:  levelPtr,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to fetch salary codes",
		})
		return
	}

	data := make([]model.SalaryCodeResponse, 0, len(rows))
	for _, s := range rows {
		data = append(data, toSalaryCodeResponse(s))
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": model.PaginatedMeta{
			Page:       page,
			Limit:      limit,
			Total:      int(total),
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	})
}

// GetSalaryCodeByID fetches a single salary code.
func (h *Handler) GetSalaryCodeByID(c *gin.Context) {
	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid salary code id"})
		return
	}

	sc, err := h.queries.GetSalaryCodeByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "salary code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    toSalaryCodeResponse(sc),
		"message": "salary code fetched successfully",
	})
}

// UpdateSalaryCode edits a salary code's level and/or amount (code is immutable).
func (h *Handler) UpdateSalaryCode(c *gin.Context) {
	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid salary code id"})
		return
	}

	var req model.UpdateSalaryCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	sc, err := h.queries.UpdateSalaryCode(c.Request.Context(), dbq.UpdateSalaryCodeParams{
		ID:     id,
		Level:  req.Level,
		Amount: req.Amount,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "salary code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to update salary code",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    toSalaryCodeResponse(sc),
		"message": "salary code updated successfully",
	})
}

// DeleteSalaryCode removes a salary code, but only if no employee references it.
func (h *Handler) DeleteSalaryCode(c *gin.Context) {
	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid salary code id"})
		return
	}

	refs, err := h.queries.CountEmployeesBySalaryCode(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
		return
	}
	if refs > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "salary code in use",
			"message": "cannot delete a salary code referenced by existing employees",
		})
		return
	}

	if _, err := h.queries.DeleteSalaryCode(c.Request.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "salary code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "salary code deleted successfully"})
}
