package services

import (
	"fmt"

	"gaeldle/newapi/config"
)

type SampleService struct {
	sqsService        *SqsService
	s3Service         *S3Service
	r2Service         *R2Service
	sampleSqsQueueURL string
}

func NewSampleService(sqsService *SqsService, s3Service *S3Service, r2Service *R2Service, cfg *config.AppConfig) *SampleService {
	return &SampleService{
		sqsService:        sqsService,
		s3Service:         s3Service,
		r2Service:         r2Service,
		sampleSqsQueueURL: cfg.SampleSqsQueueURL,
	}
}

func (s *SampleService) UploadImage(input interface{}, actorID string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/test-dir/dummy-sample.jpg", s.r2Service.PublicURL)
	return map[string]interface{}{
		"success": true,
		"url":     url,
	}, nil
}

func (s *SampleService) SendMessage(input interface{}, actorID string) (map[string]interface{}, error) {
	if s.sampleSqsQueueURL == "" {
		return map[string]interface{}{
			"success":   true,
			"messageId": "dummy-sqs-message-id",
			"message":   "Message successfully queued",
		}, nil
	}

	msgID, err := s.sqsService.SendMessage(s.sampleSqsQueueURL, input)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"success":   true,
		"messageId": msgID,
		"message":   "Message successfully queued",
	}, nil
}

func (s *SampleService) ClearQueue(actorID string) (map[string]interface{}, error) {
	if s.sampleSqsQueueURL == "" {
		return map[string]interface{}{
			"success": true,
			"message": "Queue successfully cleared",
		}, nil
	}

	err := s.sqsService.ClearQueue(s.sampleSqsQueueURL)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"success": true,
		"message": "Queue successfully cleared",
	}, nil
}
