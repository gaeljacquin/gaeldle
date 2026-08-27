package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"gaeldle/api/config"
)

type AiService struct {
	cfAccountID string
	cfAPIToken  string
	client      *http.Client
}

func NewAiService(cfg *config.AppConfig) *AiService {
	return &AiService{
		cfAccountID: cfg.CfAccountID,
		cfAPIToken:  cfg.CfAPIToken,
		client:      &http.Client{Timeout: 60 * time.Second},
	}
}

func (s *AiService) GenerateImage(prompt string, provider string) ([]byte, error) {
	if provider != "cloudflare" && provider != "" {
		return nil, fmt.Errorf("unsupported model/provider: %s", provider)
	}

	if s.cfAccountID == "" || s.cfAPIToken == "" {
		return nil, fmt.Errorf("cloudflare credentials not configured")
	}

	model := "@cf/stabilityai/stable-diffusion-xl-base-1.0"
	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s", s.cfAccountID, model)

	bodyData := map[string]string{
		"prompt": prompt,
		"negative_prompt": "text, letters, words, title, logo, watermark, label, caption, typography, font, inscription, written characters, game title, brand name, signature, UI, HUD, subtitles",
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfAPIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute Cloudflare AI request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Cloudflare AI failed: %d %s", resp.StatusCode, string(errBody))
	}

	imgBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response bytes: %w", err)
	}

	return imgBytes, nil
}
