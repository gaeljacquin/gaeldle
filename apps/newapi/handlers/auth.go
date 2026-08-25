package handlers

import (
	"encoding/json"
	"net/http"

	"gaeldle/newapi/services"
)

type AuthHandler struct {
	hexclaveService *services.HexclaveService
}

func NewAuthHandler(hexclaveService *services.HexclaveService) *AuthHandler {
	return &AuthHandler{hexclaveService: hexclaveService}
}

// HexclaveSignIn handles POST /api/auth/hexclave
func (h *AuthHandler) HexclaveSignIn(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	result, err := h.hexclaveService.SignInWithPassword(body.Email, body.Password)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"accessToken":  result.AccessToken,
			"refreshToken": result.RefreshToken,
			"tokenType":    "Bearer",
			"headerName":   "x-stack-access-token",
			"user": map[string]interface{}{
				"id":    result.UserID,
				"email": body.Email,
			},
		},
	})
}
