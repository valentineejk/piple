package model

import "github.com/jackc/pgx/v5/pgtype"

// Employee mirrors the "employees" table.
type Employee struct {
	ID            pgtype.UUID      `json:"id"`
	UserID        pgtype.UUID      `json:"user_id"`
	FirstName     string           `json:"first_name"`
	LastName      string           `json:"last_name"`
	DialCode      string           `json:"dial_code"`
	Phone         string           `json:"phone"`
	Resume        *string          `json:"resume,omitempty"`
	Country       *string          `json:"country,omitempty"`
	Address       *string          `json:"address,omitempty"`
	State         *string          `json:"state,omitempty"`
	Status        string           `json:"status"`
	Level         *string          `json:"level,omitempty"`
	SalaryCodeID  pgtype.UUID      `json:"salary_code_id"`
	Department    *string          `json:"department,omitempty"`
	BankName      *string          `json:"bank_name,omitempty"`
	BankCode      *string          `json:"bank_code,omitempty"`
	AccountNumber *string          `json:"account_number,omitempty"`
	HiredAt       pgtype.Timestamp `json:"hired_at,omitempty"`
	UpdatedAt     pgtype.Timestamp `json:"updated_at,omitempty"`
	CreatedAt     pgtype.Timestamp `json:"created_at,omitempty"`
}

// ValidEmployeeStatuses mirrors the CHECK constraint on employees.status.
var ValidEmployeeStatuses = []string{"active", "inactive", "terminated", "on_leave"}

// CreateEmployeeRequest is the payload for POST /employees.
type CreateEmployeeRequest struct {
	UserID        pgtype.UUID      `json:"user_id" binding:"required"`
	FirstName     string           `json:"first_name" binding:"required"`
	LastName      string           `json:"last_name" binding:"required"`
	DialCode      string           `json:"dial_code" binding:"required"`
	Phone         string           `json:"phone" binding:"required"`
	Resume        *string          `json:"resume"`
	Country       *string          `json:"country"`
	Address       *string          `json:"address"`
	State         *string          `json:"state"`
	Level         *string          `json:"level"`
	SalaryCodeID  pgtype.UUID      `json:"salary_code_id" binding:"required"`
	Department    *string          `json:"department"`
	BankName      *string          `json:"bank_name"`
	BankCode      *string          `json:"bank_code"`
	AccountNumber *string          `json:"account_number"`
	HiredAt       pgtype.Timestamp `json:"hired_at"`
}

// UpdateEmployeeRequest is the payload for PATCH /employees/:id.
// Scalar fields are pointers, and pgtype fields rely on their own Valid
// flag, so PATCH only updates what's actually provided in the body.
type UpdateEmployeeRequest struct {
	FirstName     *string          `json:"first_name"`
	LastName      *string          `json:"last_name"`
	DialCode      *string          `json:"dial_code"`
	Phone         *string          `json:"phone"`
	Resume        *string          `json:"resume"`
	Country       *string          `json:"country"`
	Address       *string          `json:"address"`
	State         *string          `json:"state"`
	Status        *string          `json:"status" binding:"omitempty,oneof=active inactive terminated on_leave"`
	Level         *string          `json:"level"`
	SalaryCodeID  pgtype.UUID      `json:"salary_code_id"`
	Department    *string          `json:"department"`
	BankName      *string          `json:"bank_name"`
	BankCode      *string          `json:"bank_code"`
	AccountNumber *string          `json:"account_number"`
	HiredAt       pgtype.Timestamp `json:"hired_at"`
}
