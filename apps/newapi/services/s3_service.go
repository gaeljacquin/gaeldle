package services

type S3Service struct{}

func NewS3Service() *S3Service {
	return &S3Service{}
}

func (s *S3Service) UploadImage(key string, body []byte, contentType string) error {
	return nil
}
