package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"gaeldle/api/config"
)

type HexclaveService struct {
	projectID            string
	publishableClientKey string
	apiBaseURL           string
	client               *http.Client
}

func NewHexclaveService(cfg *config.AppConfig) *HexclaveService {
	apiBaseURL := os.Getenv("HEXCLAVE_API_URL")
	if apiBaseURL == "" {
		apiBaseURL = "https://api.hexclave.com"
	}
	return &HexclaveService{
		projectID:            cfg.HexclaveProjectID,
		publishableClientKey: cfg.HexclavePublishableClientKey,
		apiBaseURL:           apiBaseURL,
		client:               &http.Client{Timeout: 10 * time.Second},
	}
}

type HexclaveSignInResult struct {
	AccessToken     string  `json:"accessToken"`
	RefreshToken    *string `json:"refreshToken"`
	UserID          *string `json:"userId"`
	ExpiresAtMillis *int64  `json:"expiresAtMillis"`
}

func (s *HexclaveService) SignInWithPassword(email, password string) (*HexclaveSignInResult, error) {
	if s.projectID == "" {
		return nil, fmt.Errorf("hexclave project ID not configured")
	}

	url := fmt.Sprintf("%s/api/v1/auth/password/sign-in", s.apiBaseURL)
	bodyData := map[string]string{
		"email":    email,
		"password": password,
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal sign-in request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create sign-in request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-stack-project-id", s.projectID)
	req.Header.Set("x-stack-publishable-client-key", s.publishableClientKey)
	req.Header.Set("x-stack-access-type", "client")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute sign-in request: %w", err)
	}
	defer resp.Body.Close()

	var payload struct {
		AccessToken     string  `json:"access_token"`
		RefreshToken    *string `json:"refresh_token"`
		UserID          *string `json:"user_id"`
		ExpiresAtMillis *int64  `json:"expires_at_millis"`
		Message         *string `json:"message"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		msg := "Invalid credentials"
		if payload.Message != nil && *payload.Message != "" {
			msg = *payload.Message
		}
		return nil, fmt.Errorf("%s", msg)
	}

	if payload.AccessToken == "" {
		return nil, fmt.Errorf("missing access token in auth response")
	}

	return &HexclaveSignInResult{
		AccessToken:     payload.AccessToken,
		RefreshToken:    payload.RefreshToken,
		UserID:          payload.UserID,
		ExpiresAtMillis: payload.ExpiresAtMillis,
	}, nil
}
