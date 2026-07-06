package services

import "time"

type ImageGenService struct{}

func NewImageGenService() *ImageGenService {
	return &ImageGenService{}
}

func (s *ImageGenService) GenerateImage(input interface{}, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":   true,
		"messageId": "dummy-msg-id-1",
	}, nil
}

func (s *ImageGenService) GenerateImages(input interface{}, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":      true,
		"imageGenId":   "dummy-image-gen-uuid",
		"gamesQueued":  5,
	}, nil
}

func (s *ImageGenService) GetImageGenStatus(imageGenId string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":     true,
		"imageGenId":  imageGenId,
		"status":      "completed",
		"total":       5,
		"processed":   5,
		"succeeded":   5,
		"failed":      0,
		"failures":    []interface{}{},
		"params":      map[string]interface{}{},
		"startedAt":   time.Now().Add(-10 * time.Minute),
		"completedAt": time.Now(),
		"createdAt":   time.Now().Add(-11 * time.Minute),
	}, nil
}
