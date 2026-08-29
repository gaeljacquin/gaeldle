package services

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gaeldle/api/config"
	"gaeldle/api/lib"
)

type SqsService struct {
	accessKeyID     string
	secretAccessKey string
	region          string
	client          *http.Client
}

func NewSqsService(cfg *config.AppConfig) *SqsService {
	region := cfg.AwsRegion
	if region == "" {
		region = "us-east-1"
	}
	return &SqsService{
		accessKeyID:     cfg.AwsAccessKeyID,
		secretAccessKey: cfg.AwsSecretAccessKey,
		region:          region,
		client:          &http.Client{Timeout: 15 * time.Second},
	}
}

type SendMessageResponse struct {
	XMLName           xml.Name `xml:"SendMessageResponse"`
	SendMessageResult struct {
		MessageId string `xml:"MessageId"`
	} `xml:"SendMessageResult"`
}

func (s *SqsService) SendMessage(queueURL string, body interface{}) (string, error) {
	if queueURL == "" {
		return "", fmt.Errorf("queue URL is empty")
	}

	var messageBody string
	switch v := body.(type) {
	case string:
		messageBody = v
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("failed to marshal message body: %w", err)
		}
		messageBody = string(b)
	}

	form := url.Values{}
	form.Set("Action", "SendMessage")
	form.Set("MessageBody", messageBody)
	form.Set("Version", "2012-11-05")

	encodedForm := form.Encode()
	req, err := http.NewRequest("POST", queueURL, strings.NewReader(encodedForm))
	if err != nil {
		return "", fmt.Errorf("failed to create SQS request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if s.accessKeyID != "" && s.secretAccessKey != "" {
		now := time.Now().UTC()
		if err := lib.SignRequest(req, []byte(encodedForm), "sqs", s.region, s.accessKeyID, s.secretAccessKey, now); err != nil {
			return "", fmt.Errorf("failed to sign SQS request: %w", err)
		}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute SQS request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		return "", fmt.Errorf("SQS SendMessage returned status %d: %s", resp.StatusCode, buf.String())
	}

	var xmlResp SendMessageResponse
	if err := xml.NewDecoder(resp.Body).Decode(&xmlResp); err == nil && xmlResp.SendMessageResult.MessageId != "" {
		return xmlResp.SendMessageResult.MessageId, nil
	}

	return "sqs-msg-success", nil
}

func (s *SqsService) HasCredentials() bool {
	return s.accessKeyID != "" && s.secretAccessKey != ""
}

type SqsReceivedMessage struct {
	MessageID     string `xml:"MessageId"`
	ReceiptHandle string `xml:"ReceiptHandle"`
	MD5OfBody     string `xml:"MD5OfBody"`
	Body          string `xml:"Body"`
}

type ReceiveMessageResult struct {
	Messages []SqsReceivedMessage `xml:"Message"`
}

type ReceiveMessagesResponse struct {
	XMLName xml.Name             `xml:"ReceiveMessageResponse"`
	Result  ReceiveMessageResult `xml:"ReceiveMessageResult"`
}

func (s *SqsService) ReceiveMessage(queueURL string, maxMessages int, waitTimeSeconds int) ([]SqsReceivedMessage, error) {
	if queueURL == "" {
		return nil, fmt.Errorf("queue URL is empty")
	}

	form := url.Values{}
	form.Set("Action", "ReceiveMessage")
	form.Set("MaxNumberOfMessages", fmt.Sprintf("%d", maxMessages))
	form.Set("WaitTimeSeconds", fmt.Sprintf("%d", waitTimeSeconds))
	form.Set("Version", "2012-11-05")

	encodedForm := form.Encode()
	req, err := http.NewRequest("POST", queueURL, strings.NewReader(encodedForm))
	if err != nil {
		return nil, fmt.Errorf("failed to create SQS ReceiveMessage request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if s.accessKeyID != "" && s.secretAccessKey != "" {
		now := time.Now().UTC()
		if err := lib.SignRequest(req, []byte(encodedForm), "sqs", s.region, s.accessKeyID, s.secretAccessKey, now); err != nil {
			return nil, fmt.Errorf("failed to sign SQS ReceiveMessage request: %w", err)
		}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute SQS ReceiveMessage request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		return nil, fmt.Errorf("SQS ReceiveMessage returned status %d: %s", resp.StatusCode, buf.String())
	}

	var xmlResp ReceiveMessagesResponse
	if err := xml.NewDecoder(resp.Body).Decode(&xmlResp); err != nil {
		return nil, fmt.Errorf("failed to decode SQS ReceiveMessage response: %w", err)
	}

	return xmlResp.Result.Messages, nil
}

func (s *SqsService) DeleteMessage(queueURL string, receiptHandle string) error {
	if queueURL == "" {
		return fmt.Errorf("queue URL is empty")
	}

	form := url.Values{}
	form.Set("Action", "DeleteMessage")
	form.Set("ReceiptHandle", receiptHandle)
	form.Set("Version", "2012-11-05")

	encodedForm := form.Encode()
	req, err := http.NewRequest("POST", queueURL, strings.NewReader(encodedForm))
	if err != nil {
		return fmt.Errorf("failed to create SQS DeleteMessage request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if s.accessKeyID != "" && s.secretAccessKey != "" {
		now := time.Now().UTC()
		if err := lib.SignRequest(req, []byte(encodedForm), "sqs", s.region, s.accessKeyID, s.secretAccessKey, now); err != nil {
			return fmt.Errorf("failed to sign SQS DeleteMessage request: %w", err)
		}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute SQS DeleteMessage request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		return fmt.Errorf("SQS DeleteMessage returned status %d: %s", resp.StatusCode, buf.String())
	}

	return nil
}

func (s *SqsService) ClearQueue(queueURL string) error {
	if queueURL == "" {
		return fmt.Errorf("queue URL is empty")
	}

	form := url.Values{}
	form.Set("Action", "PurgeQueue")
	form.Set("Version", "2012-11-05")

	encodedForm := form.Encode()
	req, err := http.NewRequest("POST", queueURL, strings.NewReader(encodedForm))
	if err != nil {
		return fmt.Errorf("failed to create SQS PurgeQueue request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	if s.accessKeyID != "" && s.secretAccessKey != "" {
		now := time.Now().UTC()
		if err := lib.SignRequest(req, []byte(encodedForm), "sqs", s.region, s.accessKeyID, s.secretAccessKey, now); err != nil {
			return fmt.Errorf("failed to sign SQS PurgeQueue request: %w", err)
		}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute SQS PurgeQueue request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		return fmt.Errorf("SQS PurgeQueue returned status %d: %s", resp.StatusCode, buf.String())
	}

	return nil
}
