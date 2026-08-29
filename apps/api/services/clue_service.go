package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"gaeldle/api/models"
)

const ClueSystemPrompt = `
  You are an expert quiz master.

  Your task is to generate exactly 1 clue for the game provided in the user request.

  Rules:
  1. Do NOT mention the name of the game in the clue.
  2. Rely only on the fields provided in the game JSON (name, summary, storyline, first_release_date, themes, keywords, game_modes, genres) to derive the clue. Do not make up facts outside the provided context, but rephrase them creatively.
  3. The resulting clue should NOT simply list or contain every provided input field. Choose the most interesting aspects to create a cohesive, single clue.
  4. You must respond with a JSON object in this format:
  {
    "clue": "Your clue here"
  }
`

type ClueHistoryItem struct {
	ID         int        `json:"id"`
	GameID     int        `json:"gameId"`
	IgdbID     int        `json:"igdbId"`
	Name       string     `json:"name"`
	Clue       string     `json:"clue"`
	Prompt     string     `json:"prompt"`
	Provider   string     `json:"provider"`
	Model      string     `json:"model"`
	OccurredAt *time.Time `json:"occurredAt"`
}

type ClueService struct {
	db           *sql.DB
	gamesService *GamesService
	aiService    *AiService
}

func NewClueService(db *sql.DB, gamesService *GamesService, aiService *AiService) *ClueService {
	return &ClueService{
		db:           db,
		gamesService: gamesService,
		aiService:    aiService,
	}
}

func (s *ClueService) GenerateClue(igdbID int, provider string, actorID string) (*models.Game, error) {
	game, err := s.gamesService.GetGameByIgdbId(igdbID)
	if err != nil || game == nil {
		return nil, fmt.Errorf("game not found")
	}

	gameData := map[string]interface{}{
		"name":               game.Name,
		"summary":            game.Summary,
		"storyline":          game.Storyline,
		"first_release_date": game.FirstReleaseDate,
		"themes":             game.Themes,
		"keywords":           game.Keywords,
		"game_modes":         game.GameModes,
		"genres":             game.Genres,
	}

	userPromptBytes, err := json.MarshalIndent(gameData, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal game data: %w", err)
	}
	userPrompt := string(userPromptBytes)

	var model string
	var rawResponse string

	switch provider {
	case "cloudflare", "":
		provider = "cloudflare"
		model = "@cf/meta/llama-3.1-8b-instruct"
		rawResponse, err = s.aiService.GenerateTextCloudflare(model, ClueSystemPrompt, userPrompt)
	case "bedrock", "nova-2-lite-v1":
		provider = "nova-2-lite-v1"
		model = "us.amazon.nova-2-lite-v1:0"
		rawResponse, err = s.aiService.GenerateTextBedrock(model, ClueSystemPrompt, userPrompt)
	default:
		return nil, fmt.Errorf("unsupported model/provider: %s", provider)
	}

	if err != nil {
		return nil, fmt.Errorf("AI text generation failed: %w", err)
	}

	clueString := extractClueString(rawResponse)
	if clueString == "" {
		clueString = strings.TrimSpace(rawResponse)
	}

	fullPrompt := fmt.Sprintf("System: %s\nUser: %s", strings.TrimSpace(ClueSystemPrompt), userPrompt)

	newItem := map[string]interface{}{
		"clue":      clueString,
		"prompt":    fullPrompt,
		"provider":  provider,
		"model":     model,
		"createdAt": time.Now().UTC().Format(time.RFC3339),
	}

	updatedGame, err := s.gamesService.UpdateGame(game.ID, map[string]interface{}{
		"clue": newItem,
	})
	if err != nil || updatedGame == nil {
		return nil, fmt.Errorf("failed to update game record: %w", err)
	}

	if s.db != nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":   igdbID,
			"gameId":   game.ID,
			"clue":     clueString,
			"prompt":   fullPrompt,
			"model":    model,
			"provider": provider,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "clue.generated", actorID, string(payload))
	}

	s.gamesService.RefreshAllGamesView(true)

	return updatedGame, nil
}

func (s *ClueService) GetClueHistory(igdbID int) ([]ClueHistoryItem, error) {
	if s.db == nil {
		return []ClueHistoryItem{}, nil
	}

	rows, err := s.db.Query(`
		SELECT id, game_id, igdb_id, name, clue, prompt, provider, model, occurred_at
		FROM games_clue_history
		WHERE igdb_id = $1
		ORDER BY occurred_at DESC
	`, igdbID)
	if err != nil {
		// Fallback query directly against domain_event and game table
		fallbackRows, fErr := s.db.Query(`
			SELECT
				de.id,
				(de.payload->>'gameId')::integer AS game_id,
				(de.payload->>'igdbId')::integer AS igdb_id,
				g.name,
				COALESCE(de.payload->>'clue', '') AS clue,
				COALESCE(de.payload->>'prompt', '') AS prompt,
				COALESCE(de.payload->>'provider', '') AS provider,
				COALESCE(de.payload->>'model', '') AS model,
				de.occurred_at
			FROM domain_event de
			JOIN game g ON g.id = (de.payload->>'gameId')::integer
			WHERE de.event_type IN ('clue.generated', 'clue.restored')
			  AND (de.payload->>'igdbId')::integer = $1
			ORDER BY de.occurred_at DESC
		`, igdbID)
		if fErr != nil {
			return nil, fErr
		}
		defer fallbackRows.Close()
		return scanClueHistoryRows(fallbackRows)
	}
	defer rows.Close()

	return scanClueHistoryRows(rows)
}

func (s *ClueService) RestoreClue(igdbID int, historyID int, actorID string) (*models.Game, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	var gameID, itemIgdbID int
	var clue, prompt, provider, model string
	err := s.db.QueryRow(`
		SELECT
			(de.payload->>'gameId')::integer,
			(de.payload->>'igdbId')::integer,
			COALESCE(de.payload->>'clue', ''),
			COALESCE(de.payload->>'prompt', ''),
			COALESCE(de.payload->>'provider', ''),
			COALESCE(de.payload->>'model', '')
		FROM domain_event de
		WHERE de.id = $1
		LIMIT 1
	`, historyID).Scan(&gameID, &itemIgdbID, &clue, &prompt, &provider, &model)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("clue history entry not found")
	}
	if err != nil {
		return nil, err
	}

	if itemIgdbID != igdbID {
		return nil, fmt.Errorf("clue history entry does not belong to this game")
	}

	restoredClue := map[string]interface{}{
		"clue":      clue,
		"prompt":    prompt,
		"provider":  provider,
		"model":     model,
		"createdAt": time.Now().UTC().Format(time.RFC3339),
	}

	updatedGame, err := s.gamesService.UpdateGame(gameID, map[string]interface{}{
		"clue": restoredClue,
	})
	if err != nil || updatedGame == nil {
		return nil, fmt.Errorf("failed to update game record: %w", err)
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"igdbId":         igdbID,
		"gameId":         gameID,
		"clue":           clue,
		"prompt":         prompt,
		"model":          model,
		"provider":       provider,
		"restoredFromId": historyID,
	})
	_, _ = s.db.Exec(`
		INSERT INTO domain_event (event_type, actor_id, payload)
		VALUES ($1, $2, $3)
	`, "clue.restored", actorID, string(payload))

	s.gamesService.RefreshAllGamesView(true)

	return updatedGame, nil
}

func scanClueHistoryRows(rows *sql.Rows) ([]ClueHistoryItem, error) {
	var items []ClueHistoryItem
	for rows.Next() {
		var item ClueHistoryItem
		var name, clue, prompt, provider, model *string
		var occurredAt *time.Time
		if err := rows.Scan(&item.ID, &item.GameID, &item.IgdbID, &name, &clue, &prompt, &provider, &model, &occurredAt); err != nil {
			continue
		}
		if name != nil {
			item.Name = *name
		}
		if clue != nil {
			item.Clue = *clue
		}
		if prompt != nil {
			item.Prompt = *prompt
		}
		if provider != nil {
			item.Provider = *provider
		}
		if model != nil {
			item.Model = *model
		}
		item.OccurredAt = occurredAt
		items = append(items, item)
	}
	if items == nil {
		items = []ClueHistoryItem{}
	}
	return items, nil
}

func extractClueString(raw string) string {
	cleaned := strings.TrimSpace(raw)
	if strings.HasPrefix(cleaned, "```json") {
		cleaned = strings.TrimPrefix(cleaned, "```json")
	} else if strings.HasPrefix(cleaned, "```") {
		cleaned = strings.TrimPrefix(cleaned, "```")
	}
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var obj map[string]interface{}
	if err := json.Unmarshal([]byte(cleaned), &obj); err == nil {
		if c, ok := obj["clue"]; ok {
			switch val := c.(type) {
			case string:
				return val
			case map[string]interface{}:
				if subClue, ok := val["clue"].(string); ok {
					return subClue
				}
			}
		}
	}

	return cleaned
}
