package model


type Role string

const (
	RoleEmployee Role = "employee"
	RoleProcurement Role = "procurement"
	RoleCeo Role = "ceo"
	RoleAdmin Role = "admin"
)

type ErrorResponse struct {	
	Code int `json:"code"`
	Message string `json:"message"`
}

func NewErrorResponse(code int, message string) *ErrorResponse {
	return &ErrorResponse{
		Code:    code,
		Message: message,
	}
}

type SuccessResponse struct {
	Code int `json:"code"`
	Message string `json:"message"`
	Data interface{} `json:"data,omitempty"`
}

func NewSuccessResponse(code int, message string, data interface{}) *SuccessResponse {
	return &SuccessResponse{
		Code:    code,
		Message: message,
		Data:    data,
	}
}

func FromStringToRole(roleStr string) Role {
	switch roleStr {
	case "employee":
		return RoleEmployee
	case "procurement":
		return RoleProcurement
	case "ceo":
		return RoleCeo
	case "admin":
		return RoleAdmin
	default:
		return ""
	}
}