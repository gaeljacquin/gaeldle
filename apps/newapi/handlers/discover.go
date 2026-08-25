package handlers

import (
	"encoding/json"
	"net/http"

	"gaeldle/newapi/middleware"
	"gaeldle/newapi/services"
)

type DiscoverHandler struct {
	discoverService *services.DiscoverService
}

func NewDiscoverHandler(discoverService *services.DiscoverService) *DiscoverHandler {
	return &DiscoverHandler{discoverService: discoverService}
}

// Scan handles POST /api/discover/scan
func (h *DiscoverHandler) Scan(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		Count int `json:"count"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, err := h.discoverService.Scan(body.Count, actorID)
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

// Apply handles POST /api/discover/apply
func (h *DiscoverHandler) Apply(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body struct {
		ScanEventID     int   `json:"scanEventId"`
		SelectedIgdbIds []int `json:"selectedIgdbIds"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	result, err := h.discoverService.Apply(body.SelectedIgdbIds, body.ScanEventID, actorID)
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
