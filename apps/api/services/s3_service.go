package services

import (
	"bytes"
	"fmt"
	"net/http"
	"strings"
	"time"

	"gaeldle/api/config"
	"gaeldle/api/lib"
)

type S3Service struct {
	endpoint        string
	bucketName      string
	accessKeyID     string
	secretAccessKey string
	region          string
	client          *http.Client
}

func NewS3Service(cfg *config.AppConfig) *S3Service {
	endpoint := cfg.R2Endpoint
	if endpoint == "" {
		endpoint = "https://localhost"
	}
	region := cfg.AwsRegion
	if region == "" {
		region = "auto"
	}
	return &S3Service{
		endpoint:        strings.TrimRight(endpoint, "/"),
		bucketName:      cfg.R2BucketName,
		accessKeyID:     cfg.R2AccessKeyID,
		secretAccessKey: cfg.R2SecretAccessKey,
		region:          region,
		client:          &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *S3Service) UploadImage(key string, fileBuffer []byte, contentType string) (string, error) {
	if s.bucketName == "" || s.accessKeyID == "" || s.secretAccessKey == "" {
		return "", fmt.Errorf("R2/S3 credentials or bucket name not configured")
	}

	trimmedKey := strings.TrimLeft(key, "/")
	targetURL := fmt.Sprintf("%s/%s/%s", s.endpoint, s.bucketName, trimmedKey)

	req, err := http.NewRequest("PUT", targetURL, bytes.NewReader(fileBuffer))
	if err != nil {
		return "", fmt.Errorf("failed to create upload request: %w", err)
	}

	if contentType == "" {
		contentType = "image/jpeg"
	}
	req.Header.Set("Content-Type", contentType)

	now := time.Now().UTC()
	if err := lib.SignRequest(req, fileBuffer, "s3", s.region, s.accessKeyID, s.secretAccessKey, now); err != nil {
		return "", fmt.Errorf("failed to sign upload request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute upload request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		return "", fmt.Errorf("R2/S3 upload returned status %d", resp.StatusCode)
	}

	return key, nil
}
