package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/jpeg"
	_ "image/png"
	"log"
	"strings"
	"sync"
	"time"

	"gaeldle/api/config"
	"gaeldle/api/models"
)

const (
	ImageGenDir       = "res"
	ImagePromptSuffix = "Funko Pop chibi art style, big head small body, large expressive eyes, scene depicts the game's iconic setting and atmosphere, vibrant colorful illustration, highly detailed digital art, no packaging, no box, no shelf, no text, no letters, no words, no titles, no logos, no watermarks, no labels, no UI elements, no written characters of any kind."
)

type ImageGenProgress struct {
	Processed  int                    `json:"processed"`
	Succeeded  int                    `json:"succeeded"`
	Failed     int                    `json:"failed"`
	Total      int                    `json:"total"`
	LatestGame string                 `json:"latestGame"`
	Failures   []models.ImageGenError `json:"failures"`
}

type ImageGenEvent struct {
	Type string      `json:"type"` // "progress", "completed", "error"
	Data interface{} `json:"data"`
}

type ImageGenStore struct {
	mu          sync.RWMutex
	progress    map[string]*ImageGenProgress
	subscribers map[string][]chan ImageGenEvent
}

func NewImageGenStore() *ImageGenStore {
	return &ImageGenStore{
		progress:    make(map[string]*ImageGenProgress),
		subscribers: make(map[string][]chan ImageGenEvent),
	}
}

func (s *ImageGenStore) SetProgress(imageGenID string, p *ImageGenProgress) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.progress[imageGenID] = p
}

func (s *ImageGenStore) GetProgress(imageGenID string) *ImageGenProgress {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.progress[imageGenID]
}

func (s *ImageGenStore) Emit(imageGenID string, event ImageGenEvent) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	subs := s.subscribers[imageGenID]
	for _, ch := range subs {
		select {
		case ch <- event:
		default:
		}
	}
}

func (s *ImageGenStore) Subscribe(imageGenID string) (chan ImageGenEvent, func()) {
	s.mu.Lock()
	ch := make(chan ImageGenEvent, 100)
	s.subscribers[imageGenID] = append(s.subscribers[imageGenID], ch)
	s.mu.Unlock()

	unsubscribe := func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		subs := s.subscribers[imageGenID]
		for i, sub := range subs {
			if sub == ch {
				s.subscribers[imageGenID] = append(subs[:i], subs[i+1:]...)
				close(ch)
				break
			}
		}
	}

	return ch, unsubscribe
}

func (s *ImageGenStore) Destroy(imageGenID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.progress, imageGenID)
	if subs, ok := s.subscribers[imageGenID]; ok {
		for _, ch := range subs {
			close(ch)
		}
		delete(s.subscribers, imageGenID)
	}
}

type ImageGenService struct {
	db               *sql.DB
	sqsService       *SqsService
	s3Service        *S3Service
	r2Service        *R2Service
	gamesService     *GamesService
	aiService        *AiService
	imageGenQueueURL string
	store            *ImageGenStore
}

func NewImageGenService(
	db *sql.DB,
	sqsService *SqsService,
	s3Service *S3Service,
	r2Service *R2Service,
	gamesService *GamesService,
	aiService *AiService,
	cfg *config.AppConfig,
) *ImageGenService {
	return &ImageGenService{
		db:               db,
		sqsService:       sqsService,
		s3Service:        s3Service,
		r2Service:        r2Service,
		gamesService:     gamesService,
		aiService:        aiService,
		imageGenQueueURL: cfg.ImageGenSqsQueueURL,
		store:            NewImageGenStore(),
	}
}

func (s *ImageGenService) GetStore() *ImageGenStore {
	return s.store
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

	msgID := fmt.Sprintf("gen-single-%d", time.Now().UnixNano())

	// If SQS is configured and credentials are present, enqueue to SQS
	if s.sqsService != nil && s.imageGenQueueURL != "" && s.sqsService.HasCredentials() {
		sentID, err := s.sqsService.SendMessage(s.imageGenQueueURL, map[string]interface{}{
			"type":    "image-gen",
			"input":   input,
			"actorId": actorID,
		})
		if err == nil {
			msgID = sentID
		}
	} else {
		// Asynchronous direct generation fallback when SQS is not configured
		go func() {
			if _, genErr := s.RunSingleGeneration(input, actorID); genErr != nil {
				log.Printf("[ImageGen] Async single generation error: %v", genErr)
			}
		}()
	}

	if s.db != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":    igdbID,
			"artStyle":  input["artStyle"],
			"messageId": msgID,
			"queueUrl":  s.imageGenQueueURL,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "image_gen.queued", actorID, string(payload))
	}

	return map[string]interface{}{
		"success":   true,
		"messageId": msgID,
	}, nil
}

func (s *ImageGenService) RunSingleGeneration(input map[string]interface{}, actorID string) (map[string]interface{}, error) {
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

	artStyleVal, _ := input["artStyle"].(string)
	if artStyleVal == "" {
		artStyleVal = "funko"
	}

	provider, _ := input["provider"].(string)
	if provider == "" {
		provider = "cloudflare"
	}

	includeStoryline, _ := input["includeStoryline"].(bool)
	includeGenres, _ := input["includeGenres"].(bool)
	includeThemes, _ := input["includeThemes"].(bool)

	game, err := s.gamesService.GetGameByIgdbId(igdbID)
	if err != nil || game == nil {
		return nil, fmt.Errorf("game not found")
	}

	artStyleDescription := "Funko Pop chibi 3D vinyl figure art style"
	if s.db != nil {
		var desc string
		if err := s.db.QueryRow("SELECT description FROM art_style WHERE LOWER(value) = LOWER($1) LIMIT 1", artStyleVal).Scan(&desc); err == nil && desc != "" {
			artStyleDescription = desc
		}
	}

	prompt := buildImagePrompt(game, includeStoryline, includeGenres, includeThemes, artStyleDescription)

	rawBytes, err := s.aiService.GenerateImage(prompt, provider)
	if err != nil {
		return nil, fmt.Errorf("failed to generate image: %w", err)
	}

	jpegBytes, err := convertToJpeg(rawBytes)
	if err != nil {
		jpegBytes = rawBytes
	}

	timestamp := time.Now().UnixMilli()
	key := fmt.Sprintf("%s/%d_%d.jpg", ImageGenDir, igdbID, timestamp)

	if s.s3Service != nil {
		if _, err := s.s3Service.UploadImage(key, jpegBytes, "image/jpeg"); err != nil {
			return nil, fmt.Errorf("failed to upload image to S3/R2: %w", err)
		}
	}

	publicURL := fmt.Sprintf("%s/%s", s.r2Service.PublicURL, key)

	// Update game's image_gen array
	var existingList []map[string]interface{}
	if len(game.ImageGen) > 0 {
		_ = json.Unmarshal(game.ImageGen, &existingList)
	}

	newItem := map[string]interface{}{
		artStyleVal: map[string]interface{}{
			"url":      publicURL,
			"prompt":   prompt,
			"provider": provider,
		},
	}

	found := false
	for i, item := range existingList {
		if _, ok := item[artStyleVal]; ok {
			existingList[i] = newItem
			found = true
			break
		}
	}
	if !found {
		existingList = append(existingList, newItem)
	}

	updatedGame, err := s.gamesService.UpdateGame(game.ID, map[string]interface{}{
		"aiImageUrl": publicURL,
		"aiPrompt":   prompt,
		"imageGen":   existingList,
	})
	if err != nil || updatedGame == nil {
		return nil, fmt.Errorf("failed to update game record: %w", err)
	}

	if s.db != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":   igdbID,
			"gameId":   game.ID,
			"url":      publicURL,
			"prompt":   prompt,
			"artStyle": artStyleVal,
			"params": map[string]interface{}{
				"includeStoryline": includeStoryline,
				"includeGenres":    includeGenres,
				"includeThemes":    includeThemes,
			},
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "image_gen.generated", actorID, string(payload))
	}

	s.gamesService.RefreshAllGamesView(true)

	return map[string]interface{}{
		"success": true,
		"url":     publicURL,
		"data":    updatedGame,
	}, nil
}

func (s *ImageGenService) GenerateImages(input map[string]interface{}, actorID string) (map[string]interface{}, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	// Check if an image generation process is already active
	var latestImageGenID string
	err := s.db.QueryRow(`
		SELECT payload->>'imageGenId'
		FROM domain_event
		WHERE event_type = 'image_gen.started'
		ORDER BY occurred_at DESC
		LIMIT 1
	`).Scan(&latestImageGenID)

	if err == nil && latestImageGenID != "" {
		var finishedID string
		fErr := s.db.QueryRow(`
			SELECT id
			FROM domain_event
			WHERE event_type = 'image_gen.finished'
			  AND payload->>'imageGenId' = $1
			LIMIT 1
		`, latestImageGenID).Scan(&finishedID)
		if fErr == sql.ErrNoRows {
			return nil, fmt.Errorf("An image generation is already active. Please wait for it to finish.")
		}
	}

	numGames := 10
	if n, ok := input["numGames"].(float64); ok && n > 0 {
		numGames = int(n)
	}

	rows, err := s.db.Query(`
		SELECT id, igdb_id, name, summary, storyline, genres, themes, keywords, image_gen
		FROM game
		WHERE ai_image_url IS NULL
		LIMIT $1
	`, numGames)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending games: %w", err)
	}
	defer rows.Close()

	var pendingGames []*models.Game
	for rows.Next() {
		var g models.Game
		var summary, storyline *string
		var genres, themes, keywords, imageGen []byte
		if err := rows.Scan(&g.ID, &g.IgdbID, &g.Name, &summary, &storyline, &genres, &themes, &keywords, &imageGen); err != nil {
			continue
		}
		g.Summary = summary
		g.Storyline = storyline
		g.Genres = json.RawMessage(genres)
		g.Themes = json.RawMessage(themes)
		g.Keywords = json.RawMessage(keywords)
		g.ImageGen = json.RawMessage(imageGen)
		pendingGames = append(pendingGames, &g)
	}

	total := len(pendingGames)
	if total == 0 {
		return nil, fmt.Errorf("No games without AI images found. All games already have AI-generated images.")
	}

	imageGenID := fmt.Sprintf("gen-%d", time.Now().UnixNano())

	payload, _ := json.Marshal(map[string]interface{}{
		"imageGenId": imageGenID,
		"total":      total,
		"params":     input,
	})
	_, _ = s.db.Exec(`
		INSERT INTO domain_event (event_type, actor_id, payload)
		VALUES ($1, $2, $3)
	`, "image_gen.started", actorID, string(payload))

	go s.runGenerationLoop(imageGenID, pendingGames, input, actorID)

	return map[string]interface{}{
		"success":     true,
		"imageGenId":  imageGenID,
		"gamesQueued": total,
	}, nil
}

func (s *ImageGenService) runGenerationLoop(imageGenID string, pendingGames []*models.Game, input map[string]interface{}, actorID string) {
	total := len(pendingGames)
	var failures []models.ImageGenError
	artStyleVal, _ := input["artStyle"].(string)
	if artStyleVal == "" {
		artStyleVal = "funko"
	}
	provider, _ := input["provider"].(string)
	if provider == "" {
		provider = "cloudflare"
	}
	includeStoryline, _ := input["includeStoryline"].(bool)
	includeGenres, _ := input["includeGenres"].(bool)
	includeThemes, _ := input["includeThemes"].(bool)

	processed := 0
	succeeded := 0
	failed := 0

	s.store.SetProgress(imageGenID, &ImageGenProgress{
		Processed:  processed,
		Succeeded:  succeeded,
		Failed:     failed,
		Total:      total,
		LatestGame: "",
		Failures:   failures,
	})

	for _, game := range pendingGames {
		singleInput := map[string]interface{}{
			"igdbId":           game.IgdbID,
			"artStyle":         artStyleVal,
			"provider":         provider,
			"includeStoryline": includeStoryline,
			"includeGenres":    includeGenres,
			"includeThemes":    includeThemes,
		}

		_, err := s.RunSingleGeneration(singleInput, actorID)
		if err != nil {
			failed++
			failures = append(failures, models.ImageGenError{
				IgdbID:   game.IgdbID,
				GameName: game.Name,
				Error:    err.Error(),
			})
			log.Printf("[ImageGen] Failed for %s (%d): %v", game.Name, game.IgdbID, err)
		} else {
			succeeded++
		}
		processed++

		progress := &ImageGenProgress{
			Processed:  processed,
			Succeeded:  succeeded,
			Failed:     failed,
			Total:      total,
			LatestGame: game.Name,
			Failures:   failures,
		}
		s.store.SetProgress(imageGenID, progress)
		s.store.Emit(imageGenID, ImageGenEvent{
			Type: "progress",
			Data: progress,
		})
	}

	finalStatus := "completed"
	if failed == total {
		finalStatus = "failed"
	}

	if s.db != nil {
		finishPayload, _ := json.Marshal(map[string]interface{}{
			"imageGenId": imageGenID,
			"status":     finalStatus,
			"total":      total,
			"processed":  processed,
			"succeeded":  succeeded,
			"failed":     failed,
			"failures":   failures,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "image_gen.finished", actorID, string(finishPayload))
	}

	s.store.Emit(imageGenID, ImageGenEvent{
		Type: "completed",
		Data: map[string]interface{}{
			"succeeded": succeeded,
			"failed":    failed,
			"failures":  failures,
		},
	})

	s.store.Destroy(imageGenID)
	s.gamesService.RefreshAllGamesView(true)
}

func (s *ImageGenService) GetImageGenStatus(imageGenID string) (map[string]interface{}, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	var startPayloadStr string
	var startOccurredAt time.Time
	err := s.db.QueryRow(`
		SELECT payload, occurred_at
		FROM domain_event
		WHERE event_type = 'image_gen.started'
		  AND payload->>'imageGenId' = $1
		LIMIT 1
	`, imageGenID).Scan(&startPayloadStr, &startOccurredAt)
	if err != nil {
		return nil, fmt.Errorf("Image generation %s not found", imageGenID)
	}

	var startPayload struct {
		ImageGenID string      `json:"imageGenId"`
		Total      int         `json:"total"`
		Params     interface{} `json:"params"`
	}
	_ = json.Unmarshal([]byte(startPayloadStr), &startPayload)

	var finishPayloadStr string
	var finishOccurredAt time.Time
	fErr := s.db.QueryRow(`
		SELECT payload, occurred_at
		FROM domain_event
		WHERE event_type = 'image_gen.finished'
		  AND payload->>'imageGenId' = $1
		LIMIT 1
	`, imageGenID).Scan(&finishPayloadStr, &finishOccurredAt)

	if fErr == nil {
		var finishPayload struct {
			Status    string                 `json:"status"`
			Total     int                    `json:"total"`
			Processed int                    `json:"processed"`
			Succeeded int                    `json:"succeeded"`
			Failed    int                    `json:"failed"`
			Failures  []models.ImageGenError `json:"failures"`
		}
		_ = json.Unmarshal([]byte(finishPayloadStr), &finishPayload)

		if finishPayload.Failures == nil {
			finishPayload.Failures = []models.ImageGenError{}
		}

		return map[string]interface{}{
			"success":     true,
			"imageGenId":  imageGenID,
			"status":      finishPayload.Status,
			"total":       finishPayload.Total,
			"processed":   finishPayload.Processed,
			"succeeded":   finishPayload.Succeeded,
			"failed":      finishPayload.Failed,
			"failures":    finishPayload.Failures,
			"params":      startPayload.Params,
			"startedAt":   startOccurredAt.Format(time.RFC3339),
			"completedAt": finishOccurredAt.Format(time.RFC3339),
			"createdAt":   startOccurredAt.Format(time.RFC3339),
		}, nil
	}

	// Check active progress in memory
	if active := s.store.GetProgress(imageGenID); active != nil {
		if active.Failures == nil {
			active.Failures = []models.ImageGenError{}
		}
		return map[string]interface{}{
			"success":     true,
			"imageGenId":  imageGenID,
			"status":      "running",
			"total":       active.Total,
			"processed":   active.Processed,
			"succeeded":   active.Succeeded,
			"failed":      active.Failed,
			"failures":    active.Failures,
			"params":      startPayload.Params,
			"startedAt":   startOccurredAt.Format(time.RFC3339),
			"completedAt": nil,
			"createdAt":   startOccurredAt.Format(time.RFC3339),
		}, nil
	}

	// Fallback failed
	return map[string]interface{}{
		"success":     true,
		"imageGenId":  imageGenID,
		"status":      "failed",
		"total":       startPayload.Total,
		"processed":   startPayload.Total,
		"succeeded":   0,
		"failed":      startPayload.Total,
		"failures":    []models.ImageGenError{{IgdbID: 0, GameName: "All games", Error: "Generation stopped or server restarted"}},
		"params":      startPayload.Params,
		"startedAt":   startOccurredAt.Format(time.RFC3339),
		"completedAt": startOccurredAt.Format(time.RFC3339),
		"createdAt":   startOccurredAt.Format(time.RFC3339),
	}, nil
}

type ImageGenConsumer struct {
	sqsService      *SqsService
	imageGenService *ImageGenService
	queueURL        string
	pollDelayMs     int
	cancel          context.CancelFunc
}

func NewImageGenConsumer(sqsService *SqsService, imageGenService *ImageGenService, cfg *config.AppConfig) *ImageGenConsumer {
	return &ImageGenConsumer{
		sqsService:      sqsService,
		imageGenService: imageGenService,
		queueURL:        cfg.ImageGenSqsQueueURL,
		pollDelayMs:     cfg.ImageGenConsumerPollDelayMs,
	}
}

func (c *ImageGenConsumer) Start(ctx context.Context) {
	if c.sqsService == nil || c.queueURL == "" || !c.sqsService.HasCredentials() {
		return
	}

	ctx, cancel := context.WithCancel(ctx)
	c.cancel = cancel

	go func() {
		log.Printf("[ImageGenConsumer] Starting SQS poll loop for queue: %s\n", c.queueURL)
		for {
			select {
			case <-ctx.Done():
				return
			default:
			}

			if c.pollDelayMs > 0 {
				time.Sleep(time.Duration(c.pollDelayMs) * time.Millisecond)
			}

			messages, err := c.sqsService.ReceiveMessage(c.queueURL, 1, 20)
			if err != nil {
				select {
				case <-ctx.Done():
					return
				case <-time.After(5 * time.Second):
					continue
				}
			}

			for _, msg := range messages {
				if msg.Body == "" {
					continue
				}

				var job struct {
					Type    string                 `json:"type"`
					Input   map[string]interface{} `json:"input"`
					ActorID string                 `json:"actorId"`
				}

				if err := json.Unmarshal([]byte(msg.Body), &job); err == nil && job.Type == "image-gen" {
					log.Printf("[ImageGenConsumer] Received single image gen job for igdbId %v", job.Input["igdbId"])
					if _, err := c.imageGenService.RunSingleGeneration(job.Input, job.ActorID); err != nil {
						log.Printf("[ImageGenConsumer] Failed to process message: %v", err)
						continue
					}
					if msg.ReceiptHandle != "" {
						_ = c.sqsService.DeleteMessage(c.queueURL, msg.ReceiptHandle)
						log.Printf("[ImageGenConsumer] Successfully processed and deleted job")
					}
				}
			}
		}
	}()
}

func (c *ImageGenConsumer) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
}

func buildImagePrompt(game *models.Game, includeStoryline, includeGenres, includeThemes bool, artStyleDescription string) string {
	var parts []string
	if artStyleDescription == "" {
		artStyleDescription = "A vibrant detailed illustration"
	}
	parts = append(parts, fmt.Sprintf("%s of iconic characters from \"%s\" set within the game's distinct world", artStyleDescription, game.Name))

	if game.Summary != nil && *game.Summary != "" {
		parts = append(parts, *game.Summary)
	}

	if includeStoryline && game.Storyline != nil && *game.Storyline != "" {
		parts = append(parts, *game.Storyline)
	}

	if includeGenres && len(game.Genres) > 0 {
		var genres []string
		_ = json.Unmarshal(game.Genres, &genres)
		if len(genres) > 0 {
			parts = append(parts, fmt.Sprintf("Genres: %s", strings.Join(genres, ", ")))
		}
	}

	if includeThemes && len(game.Themes) > 0 {
		var themes []string
		_ = json.Unmarshal(game.Themes, &themes)
		if len(themes) > 0 {
			parts = append(parts, fmt.Sprintf("Themes: %s", strings.Join(themes, ", ")))
		}
	}

	if len(game.Keywords) > 0 {
		var keywords []string
		_ = json.Unmarshal(game.Keywords, &keywords)
		if len(keywords) > 0 {
			parts = append(parts, fmt.Sprintf("Keywords: %s", strings.Join(keywords, ", ")))
		}
	}

	parts = append(parts, ImagePromptSuffix)

	return strings.Join(parts, ". ")
}

func convertToJpeg(rawBytes []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(rawBytes))
	if err != nil {
		return rawBytes, nil
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
		return rawBytes, nil
	}
	return buf.Bytes(), nil
}
