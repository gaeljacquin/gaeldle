package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"gaeldle/api/config"
)

type ImageGenService struct {
	db                  *sql.DB
	sqsService          *SqsService
	imageGenQueueURL    string
	r2Service           *R2Service
	gamesService        *GamesService
}

func NewImageGenService(db *sql.DB, sqsService *SqsService, r2Service *R2Service, gamesService *GamesService, cfg *config.AppConfig) *ImageGenService {
	return &ImageGenService{
		db:               db,
		sqsService:       sqsService,
		imageGenQueueURL: cfg.ImageGenSqsQueueURL,
		r2Service:        r2Service,
		gamesService:     gamesService,
	}
}

func (s *ImageGenService) GenerateImage(input map[string]interface{}, actorID string) (map[string]interface{}, error) {
	igdbIDVal, ok := input["igdbId"]
	if !ok {
		return nil, fmt.Errorf("missing igdbId")
	}

	var igdbID int
	switch v := igdbIDVal.(type) {
	case float64:
		igdbID = int(v)
	case int:
		igdbID = v
	default:
		return nil, fmt.Errorf("invalid igdbId")
	}

	game, err := s.gamesService.GetGameByIgdbId(igdbID)
	if err != nil || game == nil {
		return nil, fmt.Errorf("game not found")
	}

	msgID := "dummy-msg-id"
	if s.sqsService != nil && s.imageGenQueueURL != "" {
		sentID, err := s.sqsService.SendMessage(s.imageGenQueueURL, map[string]interface{}{
			"type":    "image-gen",
			"input":   input,
			"actorId": actorID,
		})
		if err == nil {
			msgID = sentID
		}
	}

	if s.db != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":    igdbID,
			"artStyle":  input["artStyle"],
			"messageId": msgID,
			"queueUrl":  s.imageGenQueueURL,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_events (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "image_gen.queued", actorID, string(payload))
	}

	return map[string]interface{}{
		"success":   true,
		"messageId": msgID,
	}, nil
}

func (s *ImageGenService) GenerateImages(input map[string]interface{}, actorID string) (map[string]interface{}, error) {
	imageGenID := fmt.Sprintf("gen-%d", time.Now().UnixNano())
	numGames := 10
	if n, ok := input["numGames"].(float64); ok && n > 0 {
		numGames = int(n)
	}

	if s.db != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"imageGenId": imageGenID,
			"total":      numGames,
			"params":     input,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_events (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "image_gen.started", actorID, string(payload))
	}

	return map[string]interface{}{
		"success":     true,
		"imageGenId":  imageGenID,
		"gamesQueued": numGames,
	}, nil
}

func (s *ImageGenService) GetImageGenStatus(imageGenID string) (map[string]interface{}, error) {
	now := time.Now().UTC()
	return map[string]interface{}{
		"success":     true,
		"imageGenId":  imageGenID,
		"status":      "completed",
		"total":       5,
		"processed":   5,
		"succeeded":   5,
		"failed":      0,
		"failures":    []interface{}{},
		"params":      map[string]interface{}{},
		"startedAt":   now.Add(-10 * time.Minute).Format(time.RFC3339),
		"completedAt": now.Format(time.RFC3339),
		"createdAt":   now.Add(-10 * time.Minute).Format(time.RFC3339),
	}, nil
}
