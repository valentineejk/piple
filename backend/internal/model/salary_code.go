package model

// SalaryCodeResponse is the JSON shape returned for a salary code.
type SalaryCodeResponse struct {
	ID     string `json:"id"`
	Code   string `json:"code"`
	Level  string `json:"level"`
	Amount int64  `json:"amount"`
}

// CreateSalaryCodeRequest is the payload for POST /salary-codes.
// The code itself is server-generated (nano id), never client-supplied.
type CreateSalaryCodeRequest struct {
	Level  string `json:"level" binding:"required"`
	Amount int64  `json:"amount" binding:"required,gt=0"`
}

// UpdateSalaryCodeRequest is the payload for PATCH /salary-codes/:id.
// Only level and amount are mutable; the code is immutable once generated.
type UpdateSalaryCodeRequest struct {
	Level  *string `json:"level"`
	Amount *int64  `json:"amount" binding:"omitempty,gt=0"`
}
