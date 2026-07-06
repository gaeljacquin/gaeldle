package handlers

import (
	"encoding/json"
	"net/http"

	"gaeldle/newapi/services"
)

type DiscoverHandler struct {
	discoverService *services.DiscoverService
}

func NewDiscoverHandler(discoverService *services.DiscoverService) *DiscoverHandler {
	return &DiscoverHandler{discoverService: discoverService}
}

// Scan dummy implementation: POST /api/discover/scan
func (h *DiscoverHandler) Scan(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		Count int `json:"count"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.discoverService.Scan(body.Count, "unknown")
	json.NewEncoder(w).Encode(result)
}

// Apply dummy implementation: POST /api/discover/apply
func (h *DiscoverHandler) Apply(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body struct {
		ScanEventID     int   `json:"scanEventId"`
		SelectedIgdbIds []int `json:"selectedIgdbIds"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.discoverService.Apply(body.SelectedIgdbIds, body.ScanEventID, "unknown")
	json.NewEncoder(w).Encode(result)
}
