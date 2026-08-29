package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"gaeldle/api/config"
	"gaeldle/api/lib"
)

type AiService struct {
	cfAccountID        string
	cfAPIToken         string
	awsAccessKeyID     string
	awsSecretAccessKey string
	awsRegion          string
	client             *http.Client
}

func NewAiService(cfg *config.AppConfig) *AiService {
	awsRegion := cfg.AwsRegion
	if awsRegion == "" {
		awsRegion = "us-east-1"
	}
	return &AiService{
		cfAccountID:        cfg.CfAccountID,
		cfAPIToken:         cfg.CfAPIToken,
		awsAccessKeyID:     cfg.AwsAccessKeyID,
		awsSecretAccessKey: cfg.AwsSecretAccessKey,
		awsRegion:          awsRegion,
		client:             &http.Client{Timeout: 60 * time.Second},
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
		"prompt":          prompt,
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

func (s *AiService) GenerateTextCloudflare(model string, systemPrompt string, userPrompt string) (string, error) {
	if s.cfAccountID == "" || s.cfAPIToken == "" {
		return "", fmt.Errorf("cloudflare credentials not configured")
	}
	if model == "" {
		model = "@cf/meta/llama-3.1-8b-instruct"
	}

	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s", s.cfAccountID, model)

	messages := []map[string]string{
		{"role": "system", "content": systemPrompt},
		{"role": "user", "content": userPrompt},
	}

	bodyData := map[string]interface{}{
		"messages": messages,
		"response_format": map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"clue": map[string]interface{}{
						"type": "string",
					},
				},
				"required": []string{"clue"},
			},
		},
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Cloudflare request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create Cloudflare request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfAPIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute Cloudflare text request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Cloudflare response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Cloudflare AI text failed: %d %s", resp.StatusCode, string(respBytes))
	}

	var cfResp struct {
		Success bool `json:"success"`
		Result  struct {
			Response json.RawMessage `json:"response"`
		} `json:"result"`
		Errors []interface{} `json:"errors"`
	}

	if err := json.Unmarshal(respBytes, &cfResp); err != nil {
		return string(respBytes), nil
	}

	if !cfResp.Success && len(cfResp.Errors) > 0 {
		return "", fmt.Errorf("Cloudflare Workers AI invocation failed: %v", cfResp.Errors)
	}

	var strResponse string
	if err := json.Unmarshal(cfResp.Result.Response, &strResponse); err == nil {
		return strResponse, nil
	}

	return string(cfResp.Result.Response), nil
}

func (s *AiService) GenerateTextBedrock(model string, systemPrompt string, userPrompt string) (string, error) {
	if s.awsAccessKeyID == "" || s.awsSecretAccessKey == "" {
		return "", fmt.Errorf("AWS Bedrock credentials not configured")
	}
	if model == "" {
		model = "us.amazon.nova-2-lite-v1:0"
	}

	url := fmt.Sprintf("https://bedrock-runtime.%s.amazonaws.com/model/%s/converse", s.awsRegion, model)

	bodyData := map[string]interface{}{
		"system": []map[string]string{
			{"text": systemPrompt},
		},
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]string{
					{"text": userPrompt},
				},
			},
		},
		"inferenceConfig": map[string]interface{}{
			"maxTokens":   1000,
			"temperature": 0.7,
		},
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Bedrock request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(jsonBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create Bedrock request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	now := time.Now().UTC()
	if err := lib.SignRequest(req, jsonBytes, "bedrock", s.awsRegion, s.awsAccessKeyID, s.awsSecretAccessKey, now); err != nil {
		return "", fmt.Errorf("failed to sign Bedrock request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute Bedrock request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Bedrock response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Bedrock AI failed: %d %s", resp.StatusCode, string(respBytes))
	}

	var bedrockResp struct {
		Output struct {
			Message struct {
				Content []struct {
					Text string `json:"text"`
				} `json:"content"`
			} `json:"message"`
		} `json:"output"`
	}

	if err := json.Unmarshal(respBytes, &bedrockResp); err != nil {
		return string(respBytes), nil
	}

	if len(bedrockResp.Output.Message.Content) > 0 {
		return bedrockResp.Output.Message.Content[0].Text, nil
	}

	return "", fmt.Errorf("bedrock returned empty content")
}
