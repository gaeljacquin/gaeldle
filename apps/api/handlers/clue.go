package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gaeldle/api/middleware"
	"gaeldle/api/services"
)

type ClueHandler struct {
	clueService *services.ClueService
}

func NewClueHandler(clueService *services.ClueService) *ClueHandler {
	return &ClueHandler{clueService: clueService}
}

// GenerateClue handles POST /api/clue/generate-clue
func (h *ClueHandler) GenerateClue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		IgdbID   int    `json:"igdbId"`
		Provider string `json:"provider"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	game, err := h.clueService.GenerateClue(body.IgdbID, body.Provider, actorID)
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
		"data":    game,
	})
}

// GetClueHistory handles GET /api/clue/history
func (h *ClueHandler) GetClueHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	igdbIDStr := r.URL.Query().Get("igdbId")
	igdbID, err := strconv.Atoi(igdbIDStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid or missing igdbId parameter",
		})
		return
	}

	history, err := h.clueService.GetClueHistory(igdbID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if history == nil {
		history = []services.ClueHistoryItem{}
	}

	json.NewEncoder(w).Encode(history)
}

// RestoreClue handles POST /api/clue/restore
func (h *ClueHandler) RestoreClue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		IgdbID    int `json:"igdbId"`
		HistoryID int `json:"historyId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	game, err := h.clueService.RestoreClue(body.IgdbID, body.HistoryID, actorID)
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
		"data":    game,
	})
}
