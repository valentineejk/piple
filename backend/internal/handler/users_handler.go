package handler

import (
	"errors"
	"log"
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

const pgUniqueViolation = "23505"

var UserRoles = map[string]bool{"employee": true, "procurement": true, "ceo": true, "admin": true}
var EmployeeStatus = map[string]bool{"active": true, "inactive": true, "terminated": true, "on_leave": true}

var parsedID pgtype.UUID

func (h *Handler) CreateUser(c *gin.Context) {

	var req model.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	if !model.ValidUserRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid role",
			"message": "role must be one of: employee, procurement, ceo, admin",
		})
		return
	}

	hashed, err := helpers.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to hash password",
		})
		return
	}

	user, err := h.queries.CreateUser(c.Request.Context(), dbq.CreateUserParams{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  hashed,
		Role:      req.Role,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation {
			c.JSON(http.StatusConflict, gin.H{
				"error":   pgErr.Message,
				"message": "a user with this email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    userResponseFromUser(user),
		"message": "user created successfully",
	})
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, ok := helpers.ParseUUID(c.Param("id"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user id",
		})
		return
	}

	var req model.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	if req.Role != nil && !model.ValidUserRoles[*req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid role",
			"message": "role must be one of: employee, procurement, ceo, admin",
		})
		return
	}

	user, err := h.queries.UpdateUser(c.Request.Context(), dbq.UpdateUserParams{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Role:      req.Role,
		ID:        id,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})
			return
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation {
			c.JSON(http.StatusConflict, gin.H{
				"error":   pgErr.Message,
				"message": "a user with this email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    userResponseFromUser(user),
		"message": "user updated successfully",
	})
}

func (h *Handler) DeleteUser(c *gin.Context) {
	id, ok := helpers.ParseUUID(c.Param("id"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid user id",
		})
		return
	}

	user, err := h.queries.SoftDeleteUser(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found or already deleted",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"message": "failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    userResponseFromUser(user),
		"message": "user deleted successfully",
	})
}

func (h *Handler) GetAllUsers(c *gin.Context) {
	status := c.Query("status")
	role := c.Query("role")

	if status != "" && !EmployeeStatus[status] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid status, must be active, inactive, terminated or on_leave",
		})
		return
	}

	if role != "" && !UserRoles[role] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role, must be employee, procurement, ceo or admin",
		})
		return
	}

	var rolePtr *string
	if role != "" {
		rolePtr = &role
	}
	page, limit := 1, 25
	if p := c.Param("page"); p != "" {
		pageInt, err := strconv.Atoi(p)
		if err != nil || pageInt < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "page must be a positive number",
			})
			return
		}
		page = pageInt
	}

	if l := c.Param("limit"); l != "" {
		limitInt, err := strconv.Atoi(l)
		if err != nil || limitInt < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "limit must be a positive number",
			})
			return
		}
		limit = limitInt
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 25
	}
	if limit > 50 {
		limit = 50
	}

	users, err := h.queries.GetAllUsers(c, dbq.GetAllUsersParams{
		Offset: int32(page-1) * int32(limit),
		Limit:  int32(limit),
		Role:   rolePtr,
	})

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "users not found",
				"message": err.Error(),
			})
			return
		}
		log.Println(err)
		return
	}

	total := len(users)
	totalPages := int(math.Ceil(float64(total / limit)))
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	c.JSON(http.StatusOK, map[string]any{
		"data": users,
		"meta": model.PaginatedMeta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	})
}

func (h *Handler) GetUserByID(c *gin.Context) {
	id := c.Param("id")

	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	if err := parsedID.Scan(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid id",
		})
		return
	}

	user, err := h.queries.GetUserByID(c.Request.Context(), parsedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})
			return
		}

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    user,
		"message": "user fetched successfully",
		"status":  http.StatusOK,
	})
}

func (h *Handler) GetCurrentUserByToken(c *gin.Context) {
	log.Println(c.Request.Context())
	rawUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}
	userID, ok := rawUserID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id in context"})
		return
	}

	if err := parsedID.Scan(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid id",
		})

		log.Println(err)
		return
	}

	user, err := h.queries.GetUserByID(c.Request.Context(), parsedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "user not found",
			})
			return
		}
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "something went wrong",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":    user,
		"message": "user fetched successfully",
		"status":  http.StatusOK,
	})
}

func userResponseFromUser(u dbq.User) model.UserWriteResponse {
	return model.UserWriteResponse{
		ID:        helpers.UUIDToString(u.ID),
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Role:      u.Role,
		CreatedAt: u.CreatedAt.Time,
		DeletedAt: helpers.TimestampToTimePtr(u.DeletedAt),
	}
}
