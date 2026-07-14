package services

type R2Service struct {
	PublicURL string
}

func NewR2Service(publicURL string) *R2Service {
	return &R2Service{PublicURL: publicURL}
}
