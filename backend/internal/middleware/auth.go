package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/valentineejk/piple/internal/model"
	"github.com/valentineejk/piple/internal/service"
)

const (
	CtxUserID = "user_id"
	CtxRole   = "role"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Authorization header required"))
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid authorization header format"))
			return
		}

		claims, err := service.Validate(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid or expired token"))
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}

func RoleRequired(roles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawRole, exists := c.Get(CtxRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Authentication required"))
			return
		}

		userRole, ok := rawRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Invalid role type in context"))
			return
		}

		for _, role := range roles {
			if string(role) == userRole {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, model.NewErrorResponse(http.StatusForbidden, "Insufficient permissions"))
	}
}
