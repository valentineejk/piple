package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	dbq "github.com/valentineejk/piple/db/sqlc"
	"github.com/valentineejk/piple/internal/helpers"
	"github.com/valentineejk/piple/internal/model"
	"github.com/valentineejk/piple/internal/service"
)

// login
func (h *Handler) Login(c *gin.Context) {
	var loginReq model.LoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, model.NewErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	// fetch user by email
	user, err := h.queries.GetUserByEmail(c, loginReq.Email)

	if err != nil {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid credentials"))
		return
	}

	if !helpers.CheckPasswordHash(loginReq.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid credentials"))
		return
	}

	// generate access and refresh tokens
	tokens, err := service.GenerateTokenPair(user.ID.String(), user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to generate tokens"))
		return
	}

	if err := service.SaveRefreshToken(func(tokenHash string, expiresAt time.Time) error {
		_, err := h.queries.CreateRefreshToken(c, dbq.CreateRefreshTokenParams{
			UserID:    user.ID,
			TokenHash: tokenHash,
			ExpiresAt: expiresAt,
		})
		return err
	}, tokens.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to store refresh token"))
		return
	}

	c.JSON(http.StatusOK, model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	})
}

// register
func (h *Handler) Register(c *gin.Context) {
	var registerReq model.RegisterRequest
	if err := c.ShouldBindJSON(&registerReq); err != nil {
		c.JSON(http.StatusBadRequest, model.NewErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	// check if user already exists
	_, err := h.queries.GetUserByEmail(c, registerReq.Email)
	if err == nil {
		c.JSON(http.StatusConflict, model.NewErrorResponse(http.StatusConflict, "User already exists"))
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to check user"))
		return
	}

	// hash password
	passwordHash, err := helpers.HashPassword(registerReq.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to hash password"))
		return
	}
	registerReq.Password = passwordHash
	// create new user
	newUser, err := h.queries.CreateUser(c, dbq.CreateUserParams{
		FirstName: registerReq.FirstName,
		LastName:  registerReq.LastName,
		Email:     registerReq.Email,
		Password:  passwordHash,
		Role:      string(model.RoleEmployee),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to create user"))
		return
	}

	c.JSON(http.StatusCreated, model.NewSuccessResponse(http.StatusCreated, "User created successfully", model.FromUserToUserResponse(newUser)))

}

// refresh

func (h *Handler) Refresh(c *gin.Context) {
	var refreshReq model.RefreshRequest
	if err := c.ShouldBindJSON(&refreshReq); err != nil {
		c.JSON(http.StatusBadRequest, model.NewErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	// validate refresh token
	claims, err := service.Validate(refreshReq.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
		return
	}
	if claims.TokenType != "refresh" {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
		return
	}

	refreshHash := helpers.HashToken(refreshReq.RefreshToken)
	storedToken, err := h.queries.GetRefreshTokenByHash(c, refreshHash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
		return
	}
	if storedToken.RevokedAt.Valid {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Refresh token revoked"))
		return
	}
	if storedToken.ExpiresAt.Time.Before(time.Now()) {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Refresh token expired"))
		return
	}

	// generate new access token
	newAccessToken, err := service.GenerateAccessToken(claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to generate access token"))
		return
	}

	c.JSON(http.StatusOK, model.NewSuccessResponse(http.StatusOK, "Access token refreshed successfully", gin.H{
		"access_token": newAccessToken,
	}))
}

// loggout
func (h *Handler) Logout(c *gin.Context) {
	var logoutReq model.LogoutRequest
	if err := c.ShouldBindJSON(&logoutReq); err != nil {
		c.JSON(http.StatusBadRequest, model.NewErrorResponse(http.StatusBadRequest, err.Error()))
		return
	}

	claims, err := service.Validate(logoutReq.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
		return
	}
	if claims.TokenType != "refresh" {
		c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
		return
	}

	refreshHash := helpers.HashToken(logoutReq.RefreshToken)
	if _, err := h.queries.RevokeRefreshToken(c, refreshHash); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, model.NewErrorResponse(http.StatusUnauthorized, "Invalid refresh token"))
			return
		}
		c.JSON(http.StatusInternalServerError, model.NewErrorResponse(http.StatusInternalServerError, "Failed to revoke refresh token"))
		return
	}

	c.JSON(http.StatusOK, model.NewSuccessResponse(http.StatusOK, "Logged out successfully", nil))
}
