package services

import (
	"strings"

	"gaeldle/newapi/config"
)

type R2Service struct {
	PublicURL string
}

func NewR2Service(cfg *config.AppConfig) *R2Service {
	return &R2Service{
		PublicURL: strings.TrimRight(cfg.R2PublicURL, "/"),
	}
}
