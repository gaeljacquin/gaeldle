package services

type SqsService struct{}

func NewSqsService() *SqsService {
	return &SqsService{}
}

func (s *SqsService) SendMessage(queueURL string, body string) (string, error) {
	return "dummy-message-id", nil
}
