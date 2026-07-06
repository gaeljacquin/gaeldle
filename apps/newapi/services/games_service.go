package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"gaeldle/newapi/models"
)

type GamesService struct {
	db *sql.DB
}

func NewGamesService(db *sql.DB) *GamesService {
	return &GamesService{db: db}
}

// GetGameByIgdbId retrieves a single game by its IGDB ID
func (s *GamesService) GetGameByIgdbId(igdbID int) (*models.Game, error) {
	query := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, info_gen, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game 
		WHERE igdb_id = $1 
		LIMIT 1`

	var game models.Game
	var imageGen, infoGen, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

	err := s.db.QueryRow(query, igdbID).Scan(
		&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
		&imageGen, &infoGen, &artworks, &keywords, &franchises,
		&gameEngines, &gameModes, &genres, &involvedCompanies,
		&platforms, &playerPerspectives, &releaseDates, &themes,
		&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	game.ImageGen = json.RawMessage(imageGen)
	game.InfoGen = json.RawMessage(infoGen)
	game.Artworks = json.RawMessage(artworks)
	game.Keywords = json.RawMessage(keywords)
	game.Franchises = json.RawMessage(franchises)
	game.GameEngines = json.RawMessage(gameEngines)
	game.GameModes = json.RawMessage(gameModes)
	game.Genres = json.RawMessage(genres)
	game.InvolvedCompanies = json.RawMessage(involvedCompanies)
	game.Platforms = json.RawMessage(platforms)
	game.PlayerPerspectives = json.RawMessage(playerPerspectives)
	game.ReleaseDates = json.RawMessage(releaseDates)
	game.Themes = json.RawMessage(themes)

	return &game, nil
}

// GetPaginatedGames retrieves games with pagination, search, and sorting
func (s *GamesService) GetPaginatedGames(page, pageSize int, q, igdbIdFilter, sortBy, sortDir string) ([]*models.Game, int, error) {
	offset := (page - 1) * pageSize

	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, info_gen, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game`

	countQuery := `SELECT count(*) FROM game`

	var conditions []string
	var args []interface{}
	argIndex := 1

	if q != "" {
		conditions = append(conditions, fmt.Sprintf("name ILIKE $%d", argIndex))
		args = append(args, "%"+q+"%")
		argIndex++
	}

	if igdbIdFilter != "" {
		conditions = append(conditions, fmt.Sprintf("igdb_id::text ILIKE $%d", argIndex))
		args = append(args, "%"+igdbIdFilter+"%")
		argIndex++
	}

	if len(conditions) > 0 {
		whereClause := " WHERE " + strings.Join(conditions, " AND ")
		baseQuery += whereClause
		countQuery += whereClause
	}

	// First query the total count
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Now build sorting
	var orderBy string
	if q != "" {
		orderBy = fmt.Sprintf("ORDER BY similarity(name, $%d) DESC", argIndex)
		args = append(args, q)
		argIndex++
	} else {
		sortCol := "name"
		switch sortBy {
		case "firstReleaseDate":
			sortCol = "first_release_date"
		case "createdAt":
			sortCol = "created_at"
		case "igdbId":
			sortCol = "igdb_id"
		}

		dir := "ASC"
		if strings.ToLower(sortDir) == "desc" {
			dir = "DESC"
		}

		if sortBy == "firstReleaseDate" {
			orderBy = fmt.Sprintf("ORDER BY %s %s NULLS LAST", sortCol, dir)
		} else {
			orderBy = fmt.Sprintf("ORDER BY %s %s", sortCol, dir)
		}
	}

	baseQuery += " " + orderBy
	baseQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := s.db.Query(baseQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var games []*models.Game
	for rows.Next() {
		var game models.Game
		var imageGen, infoGen, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &infoGen, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.InfoGen = json.RawMessage(infoGen)
		game.Artworks = json.RawMessage(artworks)
		game.Keywords = json.RawMessage(keywords)
		game.Franchises = json.RawMessage(franchises)
		game.GameEngines = json.RawMessage(gameEngines)
		game.GameModes = json.RawMessage(gameModes)
		game.Genres = json.RawMessage(genres)
		game.InvolvedCompanies = json.RawMessage(involvedCompanies)
		game.Platforms = json.RawMessage(platforms)
		game.PlayerPerspectives = json.RawMessage(playerPerspectives)
		game.ReleaseDates = json.RawMessage(releaseDates)
		game.Themes = json.RawMessage(themes)

		games = append(games, &game)
	}

	return games, total, nil
}

// GetRandomGames retrieves random games meeting specific constraints
func (s *GamesService) GetRandomGames(excludeIds []int, mode string, count int) ([]*models.Game, error) {
	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, info_gen, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game`

	var conditions []string
	var args []interface{}
	argIndex := 1

	if len(excludeIds) > 0 {
		var placeholders []string
		for _, id := range excludeIds {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
			args = append(args, id)
			argIndex++
		}
		conditions = append(conditions, fmt.Sprintf("id NOT IN (%s)", strings.Join(placeholders, ", ")))
	}

	switch mode {
	case "artwork":
		conditions = append(conditions, "artworks IS NOT NULL AND json_array_length(artworks) > 0")
	case "cover-art":
		conditions = append(conditions, "image_url IS NOT NULL")
	case "image-gen":
		conditions = append(conditions, "image_gen IS NOT NULL AND json_array_length(image_gen) > 0")
	case "timeline", "timeline-2":
		conditions = append(conditions, "first_release_date IS NOT NULL")
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += fmt.Sprintf(" ORDER BY RANDOM() LIMIT $%d", argIndex)
	args = append(args, count)

	rows, err := s.db.Query(baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var games []*models.Game
	for rows.Next() {
		var game models.Game
		var imageGen, infoGen, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &infoGen, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.InfoGen = json.RawMessage(infoGen)
		game.Artworks = json.RawMessage(artworks)
		game.Keywords = json.RawMessage(keywords)
		game.Franchises = json.RawMessage(franchises)
		game.GameEngines = json.RawMessage(gameEngines)
		game.GameModes = json.RawMessage(gameModes)
		game.Genres = json.RawMessage(genres)
		game.InvolvedCompanies = json.RawMessage(involvedCompanies)
		game.Platforms = json.RawMessage(platforms)
		game.PlayerPerspectives = json.RawMessage(playerPerspectives)
		game.ReleaseDates = json.RawMessage(releaseDates)
		game.Themes = json.RawMessage(themes)

		games = append(games, &game)
	}

	return games, nil
}

// SearchGames performs a similarity search on games
func (s *GamesService) SearchGames(q string, limit int, mode string) ([]*models.Game, error) {
	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, info_gen, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game`

	var conditions []string
	var args []interface{}
	argIndex := 1

	conditions = append(conditions, fmt.Sprintf("name ILIKE $%d", argIndex))
	args = append(args, "%"+q+"%")
	argIndex++

	switch mode {
	case "artwork":
		conditions = append(conditions, "artworks IS NOT NULL AND json_array_length(artworks) > 0")
	case "cover-art":
		conditions = append(conditions, "image_url IS NOT NULL")
	case "image-gen":
		conditions = append(conditions, "image_gen IS NOT NULL AND json_array_length(image_gen) > 0")
	case "timeline", "timeline-2":
		conditions = append(conditions, "first_release_date IS NOT NULL")
	}

	baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	baseQuery += fmt.Sprintf(" ORDER BY similarity(name, $%d) DESC LIMIT $%d", argIndex, argIndex+1)
	args = append(args, q, limit)

	rows, err := s.db.Query(baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var games []*models.Game
	for rows.Next() {
		var game models.Game
		var imageGen, infoGen, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &infoGen, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.InfoGen = json.RawMessage(infoGen)
		game.Artworks = json.RawMessage(artworks)
		game.Keywords = json.RawMessage(keywords)
		game.Franchises = json.RawMessage(franchises)
		game.GameEngines = json.RawMessage(gameEngines)
		game.GameModes = json.RawMessage(gameModes)
		game.Genres = json.RawMessage(genres)
		game.InvolvedCompanies = json.RawMessage(involvedCompanies)
		game.Platforms = json.RawMessage(platforms)
		game.PlayerPerspectives = json.RawMessage(playerPerspectives)
		game.ReleaseDates = json.RawMessage(releaseDates)
		game.Themes = json.RawMessage(themes)

		games = append(games, &game)
	}

	return games, nil
}

// SyncGameByIgdbId dummy implementation
func (s *GamesService) SyncGameByIgdbId(igdbID int, shouldRefresh bool, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":   true,
		"message":   "Game created",
		"operation": "created",
		"data": map[string]interface{}{
			"id":     9999,
			"igdbId": igdbID,
			"name":   "Dummy Game Name",
		},
	}, nil
}

// UpdateGame dummy implementation
func (s *GamesService) UpdateGame(id int, updates map[string]interface{}) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"id":     id,
			"name":   "Dummy Updated Game Name",
			"igdbId": 1234,
		},
	}, nil
}

// DeleteGame dummy implementation
func (s *GamesService) DeleteGame(id int) (int, error) {
	return id, nil
}

// DeleteGames dummy implementation
func (s *GamesService) DeleteGames(ids []int) ([]int, error) {
	return ids, nil
}

// ValidateGameForAdd dummy implementation
func (s *GamesService) ValidateGameForAdd(igdbID int, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"igdbId":       igdbID,
		"existsOnIgdb": true,
		"alreadyInDb":  false,
		"gameName":     "Dummy Candidate",
		"canAdd":       true,
	}, nil
}

// GenerateImage dummy implementation
func (s *GamesService) GenerateImage(input interface{}, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":   true,
		"messageId": "dummy-msg-id-123",
	}, nil
}

// BuildImagePrompt dummy implementation
func (s *GamesService) BuildImagePrompt(game interface{}, options interface{}, artStyleDescription string) string {
	return "dummy prompt"
}

// RefreshAllGamesView dummy implementation
func (s *GamesService) RefreshAllGamesView(immediate bool) error {
	return nil
}

// RefreshQueriedGamesView dummy implementation
func (s *GamesService) RefreshQueriedGamesView() error {
	return nil
}
