package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"gaeldle/api/models"
)

type DiscoverService struct {
	db           *sql.DB
	igdbService  *IgdbService
	gamesService *GamesService
}

func NewDiscoverService(db *sql.DB, igdbService *IgdbService, gamesService *GamesService) *DiscoverService {
	return &DiscoverService{
		db:           db,
		igdbService:  igdbService,
		gamesService: gamesService,
	}
}

type DiscoverScanResult struct {
	ScanEventID       int                        `json:"scanEventId"`
	Candidates        []models.DiscoverCandidate `json:"candidates"`
	TotalReturned     int                        `json:"totalReturned"`
	AlreadyAddedCount int                        `json:"alreadyAddedCount"`
}

func (s *DiscoverService) Scan(count int, actorID string) (*DiscoverScanResult, error) {
	if count <= 0 {
		count = 10
	}
	if count > 50 {
		count = 50
	}

	igdbResults, err := s.igdbService.DiscoverCandidates(count)
	if err != nil {
		return nil, fmt.Errorf("failed to discover candidates from IGDB: %w", err)
	}

	var igdbIDs []int
	for _, g := range igdbResults {
		igdbIDs = append(igdbIDs, g.ID)
	}

	existingSet := make(map[int]bool)
	if len(igdbIDs) > 0 && s.db != nil {
		var idStrs []string
		for _, id := range igdbIDs {
			idStrs = append(idStrs, strconv.Itoa(id))
		}
		query := fmt.Sprintf("SELECT igdb_id FROM game WHERE igdb_id IN (%s)", strings.Join(idStrs, ","))
		rows, err := s.db.Query(query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id int
				if err := rows.Scan(&id); err == nil {
					existingSet[id] = true
				}
			}
		}
	}

	var candidates []models.DiscoverCandidate
	alreadyAddedCount := 0

	for _, g := range igdbResults {
		var coverURL *string
		if g.Cover != nil {
			if g.Cover.ImageID != "" {
				u := fmt.Sprintf("https://images.igdb.com/igdb/image/upload/t_cover_big/%s.jpg", g.Cover.ImageID)
				coverURL = &u
			} else if g.Cover.URL != "" {
				full := g.Cover.URL
				if strings.HasPrefix(full, "//") {
					full = "https:" + full
				}
				u := strings.ReplaceAll(full, "t_thumb", "t_cover_big")
				coverURL = &u
			}
		}

		var genres []string
		for _, gen := range g.Genres {
			if gen.Name != "" {
				genres = append(genres, gen.Name)
			}
		}

		var platforms []string
		for _, p := range g.Platforms {
			if p.Name != "" {
				platforms = append(platforms, p.Name)
			}
		}

		isAdded := existingSet[g.ID]
		if isAdded {
			alreadyAddedCount++
		}

		candidates = append(candidates, models.DiscoverCandidate{
			IgdbID:           g.ID,
			Name:             g.Name,
			FirstReleaseDate: g.FirstReleaseDate,
			CoverURL:         coverURL,
			TotalRating:      g.TotalRating,
			TotalRatingCount: g.TotalRatingCount,
			Genres:           genres,
			Platforms:        platforms,
			IsAlreadyAdded:   isAdded,
		})
	}

	scanEventID := 0
	if s.db != nil {
		eventPayload, _ := json.Marshal(map[string]interface{}{
			"count":             count,
			"candidates":        candidates,
			"totalReturned":     len(candidates),
			"alreadyAddedCount": alreadyAddedCount,
		})

		_ = s.db.QueryRow(`
			INSERT INTO domain_events (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
			RETURNING id
		`, "discover_games.scanned", actorID, string(eventPayload)).Scan(&scanEventID)
	}

	return &DiscoverScanResult{
		ScanEventID:       scanEventID,
		Candidates:        candidates,
		TotalReturned:     len(candidates),
		AlreadyAddedCount: alreadyAddedCount,
	}, nil
}

type DiscoverApplyResponse struct {
	Success      bool                         `json:"success"`
	ApplyEventID int                          `json:"applyEventId"`
	Results      []models.DiscoverApplyResult `json:"results"`
}

func (s *DiscoverService) Apply(selectedIgdbIds []int, scanEventID int, actorID string) (*DiscoverApplyResponse, error) {
	var results []models.DiscoverApplyResult

	for _, igdbID := range selectedIgdbIds {
		res, err := s.gamesService.SyncGameByIgdbId(igdbID, false, actorID)
		if err != nil {
			errStr := err.Error()
			results = append(results, models.DiscoverApplyResult{
				IgdbID: igdbID,
				Name:   nil,
				Status: "error",
				Error:  &errStr,
			})
		} else if res != nil && res.Game != nil {
			name := res.Game.Name
			results = append(results, models.DiscoverApplyResult{
				IgdbID: igdbID,
				Name:   &name,
				Status: res.Operation,
				Error:  nil,
			})
		} else {
			errStr := "Game not found on IGDB"
			results = append(results, models.DiscoverApplyResult{
				IgdbID: igdbID,
				Name:   nil,
				Status: "error",
				Error:  &errStr,
			})
		}
	}

	applyEventID := 0
	if s.db != nil {
		eventPayload, _ := json.Marshal(map[string]interface{}{
			"scanEventId":     scanEventID,
			"selectedIgdbIds": selectedIgdbIds,
			"results":         results,
		})

		_ = s.db.QueryRow(`
			INSERT INTO domain_events (event_type, actor_id, payload)
			VALUES ($1, $2, $3)
			RETURNING id
		`, "discover_games.applied", actorID, string(eventPayload)).Scan(&applyEventID)
	}

	go s.gamesService.RefreshAllGamesView(true)

	return &DiscoverApplyResponse{
		Success:      true,
		ApplyEventID: applyEventID,
		Results:      results,
	}, nil
}
