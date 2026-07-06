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

// HexclaveSignIn dummy implementation: POST /api/auth/hexclave
func (h *AuthHandler) HexclaveSignIn(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.hexclaveService.SignInWithPassword(body.Email, body.Password)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"accessToken": result["accessToken"],
			"refreshToken": result["refreshToken"],
			"tokenType":    "Bearer",
			"headerName":   "x-stack-access-token",
			"user":         result["user"],
		},
	})
}
