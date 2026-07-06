package services

type SampleService struct{}

func NewSampleService() *SampleService {
	return &SampleService{}
}

func (s *SampleService) UploadImage(input interface{}, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success": true,
		"url":     "https://gaeldle-image-gen.gaeljacquin.com/res/dummy-sample.jpg",
	}, nil
}

func (s *SampleService) SendMessage(input interface{}, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":   true,
		"messageId": "dummy-sqs-message-id",
		"message":   "Message successfully queued",
	}, nil
}

func (s *SampleService) ClearQueue(actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success": true,
		"message": "Queue successfully cleared",
	}, nil
}
