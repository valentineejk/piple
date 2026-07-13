package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/valentineejk/piple/db/sqlc"
	"github.com/valentineejk/piple/internal/model"
)

func toEmployeeResponse(e dbq.Employee) model.Employee {
	return model.Employee{
		ID:            e.ID,
		UserID:        e.UserID,
		FirstName:     e.FirstName,
		LastName:      e.LastName,
		DialCode:      e.DialCode,
		Phone:         e.Phone,
		Resume:        e.Resume,
		Country:       e.Country,
		Address:       e.Address,
		State:         e.State,
		Status:        e.Status,
		Level:         e.Level,
		SalaryCodeID:  e.SalaryCodeID,
		Department:    e.Department,
		BankName:      e.BankName,
		BankCode:      e.BankCode,
		AccountNumber: e.AccountNumber,
		HiredAt:       e.HiredAt,
		UpdatedAt:     e.UpdatedAt,
		CreatedAt:     e.CreatedAt,
	}
}

func (h *Handler) Create_employee(c *gin.Context) {

	var req model.CreateEmployeeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	// one employee record per user
	_, err := h.queries.GetEmployeeByUserID(c.Request.Context(), req.UserID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "conflict",
			"message": "employee already exists for this user",
		})
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "db error",
		})
		return
	}

	employee, err := h.queries.CreateEmployee(c.Request.Context(), dbq.CreateEmployeeParams{
		UserID:        req.UserID,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		DialCode:      req.DialCode,
		Phone:         req.Phone,
		Resume:        req.Resume,
		Country:       req.Country,
		Address:       req.Address,
		State:         req.State,
		Level:         req.Level,
		SalaryCodeID:  req.SalaryCodeID,
		Department:    req.Department,
		BankName:      req.BankName,
		BankCode:      req.BankCode,
		AccountNumber: req.AccountNumber,
		HiredAt:       req.HiredAt,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "something went wrong",
			"message": "failed to create employee",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    toEmployeeResponse(employee),
		"message": "employee created succesfully",
	})
}

func (h *Handler) Update_employee(c *gin.Context) {

	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}

	var req model.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   err.Error(),
			"message": "invalid body data",
		})
		return
	}

	employee, err := h.queries.UpdateEmployee(c.Request.Context(), dbq.UpdateEmployeeParams{
		ID:            id,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		DialCode:      req.DialCode,
		Phone:         req.Phone,
		Resume:        req.Resume,
		Country:       req.Country,
		Address:       req.Address,
		State:         req.State,
		Status:        req.Status,
		Level:         req.Level,
		SalaryCodeID:  req.SalaryCodeID,
		Department:    req.Department,
		BankName:      req.BankName,
		BankCode:      req.BankCode,
		AccountNumber: req.AccountNumber,
		HiredAt:       req.HiredAt,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "something went wrong",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    toEmployeeResponse(employee),
		"message": "employee updated succesfully",
	})
}

func (h *Handler) Delete_employee(c *gin.Context) {

	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}

	_, err := h.queries.DeleteEmployee(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
		return
	}

	c.Status(http.StatusNoContent)
}
