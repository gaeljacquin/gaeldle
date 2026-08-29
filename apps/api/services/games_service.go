package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gaeldle/api/models"
)

type GamesService struct {
	db          *sql.DB
	igdbService *IgdbService
}

func NewGamesService(db *sql.DB, igdbService *IgdbService) *GamesService {
	return &GamesService{
		db:          db,
		igdbService: igdbService,
	}
}

// GetGameByIgdbId retrieves a single game by its IGDB ID
func (s *GamesService) GetGameByIgdbId(igdbID int) (*models.Game, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, clue, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game 
		WHERE igdb_id = $1 
		LIMIT 1`

	var game models.Game
	var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

	err := s.db.QueryRow(query, igdbID).Scan(
		&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
		&imageGen, &clue, &artworks, &keywords, &franchises,
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
	game.Clue = json.RawMessage(clue)
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

// GetGameByID retrieves a single game by its internal ID
func (s *GamesService) GetGameByID(id int) (*models.Game, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, clue, artworks, keywords, franchises, 
		       game_engines, game_modes, genres, involved_companies, 
		       platforms, player_perspectives, release_dates, themes, 
		       first_release_date, summary, storyline, created_at, updated_at
		FROM game 
		WHERE id = $1 
		LIMIT 1`

	var game models.Game
	var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

	err := s.db.QueryRow(query, id).Scan(
		&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
		&imageGen, &clue, &artworks, &keywords, &franchises,
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
	game.Clue = json.RawMessage(clue)
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
	if s.db == nil {
		return nil, 0, fmt.Errorf("database not connected")
	}

	offset := (page - 1) * pageSize

	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, clue, artworks, keywords, franchises, 
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

	// Total count
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Sorting
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
		var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &clue, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.Clue = json.RawMessage(clue)
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
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, clue, artworks, keywords, franchises, 
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
		var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &clue, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.Clue = json.RawMessage(clue)
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
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	baseQuery := `
		SELECT id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		       image_gen, clue, artworks, keywords, franchises, 
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
		var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err := rows.Scan(
			&game.ID, &game.IgdbID, &game.Name, &game.ImageURL, &game.AiImageURL, &game.AiPrompt,
			&imageGen, &clue, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&game.FirstReleaseDate, &game.Summary, &game.Storyline, &game.CreatedAt, &game.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		game.ImageGen = json.RawMessage(imageGen)
		game.Clue = json.RawMessage(clue)
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

type SyncResult struct {
	Game      *models.Game `json:"game"`
	Operation string       `json:"operation"`
}

func formatCoverURL(url string) *string {
	if url == "" {
		return nil
	}
	full := url
	if strings.HasPrefix(url, "//") {
		full = "https:" + url
	}
	formatted := strings.ReplaceAll(full, "t_thumb", "t_720p")
	return &formatted
}

type mappedGameData struct {
	IgdbID             int
	Name               string
	Summary            *string
	Storyline          *string
	FirstReleaseDate   *int64
	ImageURL           *string
	Artworks           []byte
	Platforms          []byte
	Genres             []byte
	Themes             []byte
	GameModes          []byte
	PlayerPerspectives []byte
	GameEngines        []byte
	InvolvedCompanies  []byte
	Keywords           []byte
	Franchises         []byte
	ReleaseDates       []byte
}

func mapIgdbGame(igdb *IgdbGame) *mappedGameData {
	var coverURL *string
	if igdb.Cover != nil {
		coverURL = formatCoverURL(igdb.Cover.URL)
	}

	artworks := []map[string]interface{}{}
	for _, a := range igdb.Artworks {
		url := formatCoverURL(a.URL)
		u := ""
		if url != nil {
			u = *url
		}
		artworks = append(artworks, map[string]interface{}{
			"id":       a.ID,
			"image_id": a.ImageID,
			"url":      u,
		})
	}
	artworksJSON, _ := json.Marshal(artworks)

	platforms := []string{}
	for _, p := range igdb.Platforms {
		platforms = append(platforms, p.Name)
	}
	platformsJSON, _ := json.Marshal(platforms)

	genres := []string{}
	for _, g := range igdb.Genres {
		genres = append(genres, g.Name)
	}
	genresJSON, _ := json.Marshal(genres)

	themes := []string{}
	for _, t := range igdb.Themes {
		themes = append(themes, t.Name)
	}
	themesJSON, _ := json.Marshal(themes)

	gameModes := []string{}
	for _, m := range igdb.GameModes {
		gameModes = append(gameModes, m.Name)
	}
	gameModesJSON, _ := json.Marshal(gameModes)

	perspectives := []string{}
	for _, p := range igdb.PlayerPerspectives {
		perspectives = append(perspectives, p.Name)
	}
	perspectivesJSON, _ := json.Marshal(perspectives)

	engines := []string{}
	for _, e := range igdb.GameEngines {
		engines = append(engines, e.Name)
	}
	enginesJSON, _ := json.Marshal(engines)

	companies := []map[string]interface{}{}
	for _, c := range igdb.InvolvedCompanies {
		cName := ""
		if c.Company != nil {
			cName = c.Company.Name
		}
		companies = append(companies, map[string]interface{}{
			"name":      cName,
			"developer": c.Developer,
			"publisher": c.Publisher,
		})
	}
	companiesJSON, _ := json.Marshal(companies)

	keywords := []string{}
	for _, k := range igdb.Keywords {
		keywords = append(keywords, k.Name)
	}
	keywordsJSON, _ := json.Marshal(keywords)

	franchises := []string{}
	for _, f := range igdb.Franchises {
		franchises = append(franchises, f.Name)
	}
	franchisesJSON, _ := json.Marshal(franchises)

	releases := []map[string]interface{}{}
	for _, r := range igdb.ReleaseDates {
		pName := ""
		if r.Platform != nil {
			pName = r.Platform.Name
		}
		releases = append(releases, map[string]interface{}{
			"date":     r.Date,
			"platform": pName,
		})
	}
	releasesJSON, _ := json.Marshal(releases)

	return &mappedGameData{
		IgdbID:             igdb.ID,
		Name:               igdb.Name,
		Summary:            igdb.Summary,
		Storyline:          igdb.Storyline,
		FirstReleaseDate:   igdb.FirstReleaseDate,
		ImageURL:           coverURL,
		Artworks:           artworksJSON,
		Platforms:          platformsJSON,
		Genres:             genresJSON,
		Themes:             themesJSON,
		GameModes:          gameModesJSON,
		PlayerPerspectives: perspectivesJSON,
		GameEngines:        enginesJSON,
		InvolvedCompanies:  companiesJSON,
		Keywords:           keywordsJSON,
		Franchises:         franchisesJSON,
		ReleaseDates:       releasesJSON,
	}
}

// SyncGameByIgdbId syncs or creates a game record from IGDB
func (s *GamesService) SyncGameByIgdbId(igdbID int, shouldRefresh bool, actorID string) (*SyncResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	success := false
	var errorMessage string
	var operation string
	var syncedGame *models.Game

	defer func() {
		payload := map[string]interface{}{
			"success": success,
			"igdbId":  igdbID,
		}
		if operation != "" {
			payload["operation"] = operation
		}
		if syncedGame != nil {
			payload["gameId"] = syncedGame.ID
			payload["gameName"] = syncedGame.Name
		}
		if errorMessage != "" {
			payload["error"] = errorMessage
		}

		payloadBytes, _ := json.Marshal(payload)
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "game.added", actorID, string(payloadBytes))
	}()

	igdbGame, err := s.igdbService.GetGameById(igdbID)
	if err != nil {
		errorMessage = err.Error()
		return nil, err
	}
	if igdbGame == nil {
		errorMessage = "Game not found on IGDB"
		return nil, fmt.Errorf("game not found on IGDB")
	}

	data := mapIgdbGame(igdbGame)

	// Check if already exists in DB
	existing, err := s.GetGameByIgdbId(igdbID)
	if err != nil {
		errorMessage = err.Error()
		return nil, err
	}

	if existing != nil {
		// Update
		query := `
			UPDATE game
			SET name = $1, summary = $2, storyline = $3, first_release_date = $4,
			    image_url = $5, artworks = $6, platforms = $7, genres = $8,
			    themes = $9, game_modes = $10, player_perspectives = $11,
			    game_engines = $12, involved_companies = $13, keywords = $14,
			    franchises = $15, release_dates = $16, updated_at = NOW()
			WHERE igdb_id = $17
			RETURNING id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
			          image_gen, clue, artworks, keywords, franchises, 
			          game_engines, game_modes, genres, involved_companies, 
			          platforms, player_perspectives, release_dates, themes, 
			          first_release_date, summary, storyline, created_at, updated_at`

		var g models.Game
		var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

		err = s.db.QueryRow(query,
			data.Name, data.Summary, data.Storyline, data.FirstReleaseDate,
			data.ImageURL, data.Artworks, data.Platforms, data.Genres,
			data.Themes, data.GameModes, data.PlayerPerspectives,
			data.GameEngines, data.InvolvedCompanies, data.Keywords,
			data.Franchises, data.ReleaseDates, igdbID,
		).Scan(
			&g.ID, &g.IgdbID, &g.Name, &g.ImageURL, &g.AiImageURL, &g.AiPrompt,
			&imageGen, &clue, &artworks, &keywords, &franchises,
			&gameEngines, &gameModes, &genres, &involvedCompanies,
			&platforms, &playerPerspectives, &releaseDates, &themes,
			&g.FirstReleaseDate, &g.Summary, &g.Storyline, &g.CreatedAt, &g.UpdatedAt,
		)
		if err != nil {
			errorMessage = err.Error()
			return nil, err
		}

		g.ImageGen = json.RawMessage(imageGen)
		g.Clue = json.RawMessage(clue)
		g.Artworks = json.RawMessage(artworks)
		g.Keywords = json.RawMessage(keywords)
		g.Franchises = json.RawMessage(franchises)
		g.GameEngines = json.RawMessage(gameEngines)
		g.GameModes = json.RawMessage(gameModes)
		g.Genres = json.RawMessage(genres)
		g.InvolvedCompanies = json.RawMessage(involvedCompanies)
		g.Platforms = json.RawMessage(platforms)
		g.PlayerPerspectives = json.RawMessage(playerPerspectives)
		g.ReleaseDates = json.RawMessage(releaseDates)
		g.Themes = json.RawMessage(themes)

		operation = "updated"
		syncedGame = &g
		success = true

		if shouldRefresh {
			go s.RefreshAllGamesView(false)
		}

		return &SyncResult{Game: syncedGame, Operation: operation}, nil
	}

	// Insert
	insertQuery := `
		INSERT INTO game (
			igdb_id, name, summary, storyline, first_release_date,
			image_url, artworks, platforms, genres, themes,
			game_modes, player_perspectives, game_engines, involved_companies,
			keywords, franchises, release_dates, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10,
			$11, $12, $13, $14,
			$15, $16, $17, NOW(), NOW()
		)
		RETURNING id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		          image_gen, clue, artworks, keywords, franchises, 
		          game_engines, game_modes, genres, involved_companies, 
		          platforms, player_perspectives, release_dates, themes, 
		          first_release_date, summary, storyline, created_at, updated_at`

	var g models.Game
	var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

	err = s.db.QueryRow(insertQuery,
		data.IgdbID, data.Name, data.Summary, data.Storyline, data.FirstReleaseDate,
		data.ImageURL, data.Artworks, data.Platforms, data.Genres, data.Themes,
		data.GameModes, data.PlayerPerspectives, data.GameEngines, data.InvolvedCompanies,
		data.Keywords, data.Franchises, data.ReleaseDates,
	).Scan(
		&g.ID, &g.IgdbID, &g.Name, &g.ImageURL, &g.AiImageURL, &g.AiPrompt,
		&imageGen, &clue, &artworks, &keywords, &franchises,
		&gameEngines, &gameModes, &genres, &involvedCompanies,
		&platforms, &playerPerspectives, &releaseDates, &themes,
		&g.FirstReleaseDate, &g.Summary, &g.Storyline, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		errorMessage = err.Error()
		return nil, err
	}

	g.ImageGen = json.RawMessage(imageGen)
	g.Clue = json.RawMessage(clue)
	g.Artworks = json.RawMessage(artworks)
	g.Keywords = json.RawMessage(keywords)
	g.Franchises = json.RawMessage(franchises)
	g.GameEngines = json.RawMessage(gameEngines)
	g.GameModes = json.RawMessage(gameModes)
	g.Genres = json.RawMessage(genres)
	g.InvolvedCompanies = json.RawMessage(involvedCompanies)
	g.Platforms = json.RawMessage(platforms)
	g.PlayerPerspectives = json.RawMessage(playerPerspectives)
	g.ReleaseDates = json.RawMessage(releaseDates)
	g.Themes = json.RawMessage(themes)

	operation = "created"
	syncedGame = &g
	success = true

	if shouldRefresh {
		go s.RefreshAllGamesView(false)
	}

	return &SyncResult{Game: syncedGame, Operation: operation}, nil
}

// UpdateGame updates fields on a game
func (s *GamesService) UpdateGame(id int, updates map[string]interface{}) (*models.Game, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	if len(updates) == 0 {
		return s.GetGameByID(id)
	}

	var setClauses []string
	var args []interface{}
	argIdx := 1

	for k, v := range updates {
		colName := ""
		switch k {
		case "name":
			colName = "name"
		case "summary":
			colName = "summary"
		case "storyline":
			colName = "storyline"
		case "firstReleaseDate":
			colName = "first_release_date"
		case "imageUrl":
			colName = "image_url"
		case "aiImageUrl":
			colName = "ai_image_url"
		case "aiPrompt":
			colName = "ai_prompt"
		case "imageGen":
			colName = "image_gen"
		case "clue":
			colName = "clue"
		}

		if colName != "" {
			switch val := v.(type) {
			case []interface{}, map[string]interface{}:
				b, _ := json.Marshal(val)
				setClauses = append(setClauses, fmt.Sprintf("%s = $%d", colName, argIdx))
				args = append(args, string(b))
			default:
				setClauses = append(setClauses, fmt.Sprintf("%s = $%d", colName, argIdx))
				args = append(args, v)
			}
			argIdx++
		}
	}

	if len(setClauses) == 0 {
		return s.GetGameByID(id)
	}

	setClauses = append(setClauses, "updated_at = NOW()")
	query := fmt.Sprintf(`
		UPDATE game
		SET %s
		WHERE id = $%d
		RETURNING id, igdb_id, name, image_url, ai_image_url, ai_prompt, 
		          image_gen, clue, artworks, keywords, franchises, 
		          game_engines, game_modes, genres, involved_companies, 
		          platforms, player_perspectives, release_dates, themes, 
		          first_release_date, summary, storyline, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx)
	args = append(args, id)

	var g models.Game
	var imageGen, clue, artworks, keywords, franchises, gameEngines, gameModes, genres, involvedCompanies, platforms, playerPerspectives, releaseDates, themes []byte

	err := s.db.QueryRow(query, args...).Scan(
		&g.ID, &g.IgdbID, &g.Name, &g.ImageURL, &g.AiImageURL, &g.AiPrompt,
		&imageGen, &clue, &artworks, &keywords, &franchises,
		&gameEngines, &gameModes, &genres, &involvedCompanies,
		&platforms, &playerPerspectives, &releaseDates, &themes,
		&g.FirstReleaseDate, &g.Summary, &g.Storyline, &g.CreatedAt, &g.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	g.ImageGen = json.RawMessage(imageGen)
	g.Clue = json.RawMessage(clue)
	g.Artworks = json.RawMessage(artworks)
	g.Keywords = json.RawMessage(keywords)
	g.Franchises = json.RawMessage(franchises)
	g.GameEngines = json.RawMessage(gameEngines)
	g.GameModes = json.RawMessage(gameModes)
	g.Genres = json.RawMessage(genres)
	g.InvolvedCompanies = json.RawMessage(involvedCompanies)
	g.Platforms = json.RawMessage(platforms)
	g.PlayerPerspectives = json.RawMessage(playerPerspectives)
	g.ReleaseDates = json.RawMessage(releaseDates)
	g.Themes = json.RawMessage(themes)

	go s.RefreshAllGamesView(false)

	return &g, nil
}

// DeleteGame deletes a single game
func (s *GamesService) DeleteGame(id int) (*int, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var deletedID int
	err := s.db.QueryRow("DELETE FROM game WHERE id = $1 RETURNING id", id).Scan(&deletedID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	go s.RefreshAllGamesView(false)
	return &deletedID, nil
}

// DeleteGames deletes multiple games
func (s *GamesService) DeleteGames(ids []int) ([]int, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	if len(ids) == 0 {
		return []int{}, nil
	}

	var placeholders []string
	var args []interface{}
	for i, id := range ids {
		placeholders = append(placeholders, fmt.Sprintf("$%d", i+1))
		args = append(args, id)
	}

	query := fmt.Sprintf("DELETE FROM game WHERE id IN (%s) RETURNING id", strings.Join(placeholders, ", "))
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deletedIDs []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err == nil {
			deletedIDs = append(deletedIDs, id)
		}
	}

	if len(deletedIDs) > 0 {
		go s.RefreshAllGamesView(false)
	}

	return deletedIDs, nil
}

type ValidateAddResult struct {
	IgdbID       int     `json:"igdbId"`
	ExistsOnIgdb bool    `json:"existsOnIgdb"`
	AlreadyInDb  bool    `json:"alreadyInDb"`
	GameName     *string `json:"gameName"`
	CanAdd       bool    `json:"canAdd"`
}

// ValidateGameForAdd checks if a game can be added by IGDB ID
func (s *GamesService) ValidateGameForAdd(igdbID int, actorID string) (*ValidateAddResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var existingID int
	var existingName string
	err := s.db.QueryRow("SELECT id, name FROM game WHERE igdb_id = $1 LIMIT 1", igdbID).Scan(&existingID, &existingName)
	if err == nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":      igdbID,
			"gameName":    existingName,
			"found":       true,
			"alreadyInDb": true,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "game.queried", actorID, string(payload))

		return &ValidateAddResult{
			IgdbID:       igdbID,
			ExistsOnIgdb: true,
			AlreadyInDb:  true,
			GameName:     &existingName,
			CanAdd:       false,
		}, nil
	}

	// Check cached queried_games materialized view
	var cachedName string
	err = s.db.QueryRow("SELECT name FROM queried_games WHERE igdb_id = $1 LIMIT 1", igdbID).Scan(&cachedName)
	if err == nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":      igdbID,
			"gameName":    cachedName,
			"found":       true,
			"alreadyInDb": false,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "game.queried", actorID, string(payload))

		return &ValidateAddResult{
			IgdbID:       igdbID,
			ExistsOnIgdb: true,
			AlreadyInDb:  false,
			GameName:     &cachedName,
			CanAdd:       true,
		}, nil
	}

	// Query IGDB
	igdbGame, err := s.igdbService.GetGameById(igdbID)
	if err != nil || igdbGame == nil {
		payload, _ := json.Marshal(map[string]interface{}{
			"igdbId":      igdbID,
			"found":       false,
			"alreadyInDb": false,
		})
		_, _ = s.db.Exec(`
			INSERT INTO domain_event (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
		`, "game.queried", actorID, string(payload))

		return &ValidateAddResult{
			IgdbID:       igdbID,
			ExistsOnIgdb: false,
			AlreadyInDb:  false,
			GameName:     nil,
			CanAdd:       false,
		}, nil
	}

	name := igdbGame.Name
	payload, _ := json.Marshal(map[string]interface{}{
		"igdbId":      igdbID,
		"gameName":    name,
		"found":       true,
		"alreadyInDb": false,
	})
	_, _ = s.db.Exec(`
		INSERT INTO domain_event (event_type, actor_id, payload)
		VALUES ($1, $2, $3)
	`, "game.queried", actorID, string(payload))

	go s.RefreshQueriedGamesView()

	return &ValidateAddResult{
		IgdbID:       igdbID,
		ExistsOnIgdb: true,
		AlreadyInDb:  false,
		GameName:     &name,
		CanAdd:       true,
	}, nil
}

// RefreshAllGamesView refreshes all materialized views
func (s *GamesService) RefreshAllGamesView(immediate bool) {
	if s.db == nil {
		return
	}
	if !immediate {
		time.Sleep(1 * time.Second)
	}

	if _, err := s.db.Exec("REFRESH MATERIALIZED VIEW all_games"); err != nil {
		log.Printf("Failed to refresh all_games: %v", err)
	}
	s.RefreshQueriedGamesView()
	s.RefreshGamesClueHistoryView()
}

// RefreshQueriedGamesView refreshes queried_games view
func (s *GamesService) RefreshQueriedGamesView() {
	if s.db == nil {
		return
	}
	if _, err := s.db.Exec("REFRESH MATERIALIZED VIEW queried_games"); err != nil {
		log.Printf("Failed to refresh queried_games: %v", err)
	}
}

// RefreshGamesClueHistoryView refreshes games_clue_history view
func (s *GamesService) RefreshGamesClueHistoryView() {
	if s.db == nil {
		return
	}
	if _, err := s.db.Exec("REFRESH MATERIALIZED VIEW games_clue_history"); err != nil {
		log.Printf("Failed to refresh games_clue_history: %v", err)
	}
}
