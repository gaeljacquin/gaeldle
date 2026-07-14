package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"gaeldle/newapi/models"
	"gaeldle/newapi/services"
)

type GamesHandler struct {
	gamesService *services.GamesService
}

func NewGamesHandler(gamesService *services.GamesService) *GamesHandler {
	return &GamesHandler{gamesService: gamesService}
}

// GetGames handles GET /api/games
func (h *GamesHandler) GetGames(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	query := r.URL.Query()

	page := 1
	if pageStr := query.Get("page"); pageStr != "" {
		if val, err := strconv.Atoi(pageStr); err == nil && val > 0 {
			page = val
		}
	}

	pageSize := 10
	if pageSizeStr := query.Get("pageSize"); pageSizeStr != "" {
		if val, err := strconv.Atoi(pageSizeStr); err == nil && val > 0 {
			pageSize = val
		}
	}

	q := query.Get("q")
	igdbIdFilter := query.Get("igdbId")
	sortBy := query.Get("sortBy")
	if sortBy == "" {
		sortBy = "name"
	}
	sortDir := query.Get("sortDir")
	if sortDir == "" {
		sortDir = "asc"
	}

	gamesList, total, err := h.gamesService.GetPaginatedGames(page, pageSize, q, igdbIdFilter, sortBy, sortDir)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if gamesList == nil {
		gamesList = []*models.Game{} // Ensure it returns empty array instead of null in JSON
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    gamesList,
		"meta": map[string]interface{}{
			"page":     page,
			"pageSize": pageSize,
			"total":    total,
		},
	})
}

// GetRandomGame handles GET /api/games/random
func (h *GamesHandler) GetRandomGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	query := r.URL.Query()

	excludeIdsStr := query.Get("excludeIds")
	var excludeIds []int
	if excludeIdsStr != "" {
		for _, idStr := range strings.Split(excludeIdsStr, ",") {
			if id, err := strconv.Atoi(strings.TrimSpace(idStr)); err == nil {
				excludeIds = append(excludeIds, id)
			}
		}
	}

	count := 1
	hasCount := query.Has("count")
	if countStr := query.Get("count"); countStr != "" {
		if val, err := strconv.Atoi(countStr); err == nil && val > 0 {
			count = val
			if count > 50 {
				count = 50
			}
		}
	}

	mode := query.Get("mode")

	gamesList, err := h.gamesService.GetRandomGames(excludeIds, mode, count)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if len(gamesList) == 0 {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "No game found",
		})
		return
	}

	// If count is 1 and count was not explicitly requested, return a single object
	if count == 1 && !hasCount {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    gamesList[0],
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    gamesList,
	})
}

// SearchGames handles GET /api/games/search
func (h *GamesHandler) SearchGames(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	query := r.URL.Query()

	q := query.Get("q")
	limit := 20
	if limitStr := query.Get("limit"); limitStr != "" {
		if val, err := strconv.Atoi(limitStr); err == nil && val > 0 {
			limit = val
		}
	}
	mode := query.Get("mode")

	if len(q) < 3 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    []interface{}{},
		})
		return
	}

	gamesList, err := h.gamesService.SearchGames(q, limit, mode)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if gamesList == nil {
		gamesList = []*models.Game{}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    gamesList,
	})
}

// GetGameByIgdbId handles GET /api/private/games/{igdbId}
func (h *GamesHandler) GetGameByIgdbId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	igdbIdStr := r.PathValue("igdbId")
	igdbId, err := strconv.Atoi(igdbIdStr)

	if err != nil || igdbId <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Invalid igdbId",
		})
		return
	}

	game, err := h.gamesService.GetGameByIgdbId(igdbId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if game == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Game not found",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    game,
	})
}

// SyncGame dummy implementation: POST /api/games/sync
func (h *GamesHandler) SyncGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		IgdbID int `json:"igdb_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	result, _ := h.gamesService.SyncGameByIgdbId(body.IgdbID, true, "unknown")
	json.NewEncoder(w).Encode(result)
}

// UpdateGame dummy implementation: PATCH /api/games/{id}
func (h *GamesHandler) UpdateGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid ID path parameter",
		})
		return
	}

	var updates map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&updates)

	result, _ := h.gamesService.UpdateGame(id, updates)
	json.NewEncoder(w).Encode(result)
}

// DeleteGame dummy implementation: DELETE /api/games/{id}
func (h *GamesHandler) DeleteGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid ID path parameter",
		})
		return
	}

	deletedId, _ := h.gamesService.DeleteGame(id)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"id": deletedId,
		},
	})
}

// DeleteBulk dummy implementation: DELETE /api/games/bulk
func (h *GamesHandler) DeleteBulk(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var ids []int
	if err := json.NewDecoder(r.Body).Decode(&ids); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body, array of IDs expected",
		})
		return
	}

	deletedIds, _ := h.gamesService.DeleteGames(ids)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"deletedIds": deletedIds,
		},
	})
}

// ValidateIgdbIdAdd dummy implementation: POST /api/games/add/validate-one
func (h *GamesHandler) ValidateIgdbIdAdd(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		IgdbID int `json:"igdbId"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.gamesService.ValidateGameForAdd(body.IgdbID, "unknown")
	json.NewEncoder(w).Encode(result)
}

// TestUpload dummy implementation: POST /api/games/test-upload
func (h *GamesHandler) TestUpload(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     "https://gaeldle-image-gen.gaeljacquin.com/test-dir/dummy-test-upload.jpg",
	})
}

// TestSendMessage dummy implementation: POST /api/test/send-message
func (h *GamesHandler) TestSendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     "https://sqs.us-east-2.amazonaws.com/153860374768/gaeldle-test",
	})
}
