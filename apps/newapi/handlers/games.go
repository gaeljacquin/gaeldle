package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"gaeldle/newapi/middleware"
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
		gamesList = []*models.Game{}
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
			"success": false,
			"error":   "Invalid igdbId",
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
			"success": false,
			"error":   "Game not found",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    game,
	})
}

// SyncGame handles POST /api/games/sync
func (h *GamesHandler) SyncGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		IgdbID int `json:"igdb_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IgdbID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body or igdb_id",
		})
		return
	}

	result, err := h.gamesService.SyncGameByIgdbId(body.IgdbID, true, actorID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"message":   "Game " + result.Operation,
		"operation": result.Operation,
		"data":      result.Game,
	})
}

// UpdateGame handles PATCH /api/games/{id}
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

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	updates := body
	if u, ok := body["updates"].(map[string]interface{}); ok {
		updates = u
	}

	updatedGame, err := h.gamesService.UpdateGame(id, updates)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if updatedGame == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Game not found",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    updatedGame,
	})
}

// DeleteGame handles DELETE /api/games/{id}
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

	deletedID, err := h.gamesService.DeleteGame(id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if deletedID == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Game not found",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"id": *deletedID,
		},
	})
}

// DeleteBulk handles DELETE /api/games/bulk
func (h *GamesHandler) DeleteBulk(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var raw json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	var ids []int
	if err := json.Unmarshal(raw, &ids); err != nil {
		var wrapper struct {
			IDs []int `json:"ids"`
		}
		if err := json.Unmarshal(raw, &wrapper); err == nil {
			ids = wrapper.IDs
		}
	}

	deletedIDs, err := h.gamesService.DeleteGames(ids)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"deletedIds": deletedIDs,
		},
	})
}

// ValidateIgdbIdAdd handles POST /api/games/add/validate-one
func (h *GamesHandler) ValidateIgdbIdAdd(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		IgdbID int `json:"igdbId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IgdbID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body or igdbId",
		})
		return
	}

	result, err := h.gamesService.ValidateGameForAdd(body.IgdbID, actorID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(result)
}

// TestUpload handles POST /api/games/test-upload
func (h *GamesHandler) TestUpload(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     "https://gaeldle-image-gen.gaeljacquin.com/test-dir/dummy-test-upload.jpg",
	})
}

// TestSendMessage handles POST /api/test/send-message
func (h *GamesHandler) TestSendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     "https://sqs.us-east-2.amazonaws.com/153860374768/gaeldle-test",
	})
}
