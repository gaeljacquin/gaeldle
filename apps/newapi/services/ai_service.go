package services

type AiService struct{}

func NewAiService() *AiService {
	return &AiService{}
}

func (s *AiService) GenerateImage(prompt string) ([]byte, error) {
	return []byte("dummy-image-bytes"), nil
}
