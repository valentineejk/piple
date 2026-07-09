package service

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/valentineejk/piple/internal/helpers"
)

type CreateRefreshTokenFn func(tokenHash string, expiresAt time.Time) error

func SaveRefreshToken(function CreateRefreshTokenFn, rawToken string) error {
	tokenHash := helpers.HashToken(rawToken)
	return function(tokenHash, time.Now().Add(7*24*time.Hour))
}

const (
	accessTokenDuration  = 15 * time.Minute
	refreshTokenDuration = 7 * 24 * time.Hour
	tokenTypeAccess      = "access"
	tokenTypeRefresh     = "refresh"
)

type Claims struct {
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

func GenerateAccessToken(UserID string, Role string) (string, error) {
	claims := Claims{
		UserID:    UserID,
		Role:      Role,
		TokenType: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   UserID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenDuration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())

}

func GenerateRefresh(UserID string, Role string) (string, error) {

	claims := Claims{
		UserID:    UserID,
		Role:      Role,
		TokenType: tokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   UserID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshTokenDuration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())

}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

func GenerateTokenPair(UserID, Role string) (*TokenPair, error) {
	accessToken, err := GenerateAccessToken(UserID, Role)
	if err != nil {
		return nil, err
	}
	refreshToken, err := GenerateRefresh(UserID, Role)
	if err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func Validate(tokenStr string) (*Claims, error) {

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{},
		func(t *jwt.Token) (interface{}, error) {
			//verify Algorithm
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("wrong signing method")
			}
			return jwtSecret(), nil

		})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil

}
