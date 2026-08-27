package handlers

import (
	"encoding/json"
	"net/http"

	"gaeldle/api/middleware"
	"gaeldle/api/services"
)

type SampleHandler struct {
	sampleService *services.SampleService
}

func NewSampleHandler(sampleService *services.SampleService) *SampleHandler {
	return &SampleHandler{sampleService: sampleService}
}

// UploadImage handles POST /api/sample/upload-image
func (h *SampleHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, err := h.sampleService.UploadImage(body, actorID)
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

// SendMessage handles POST /api/sample/send-message
func (h *SampleHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, err := h.sampleService.SendMessage(body, actorID)
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

// ClearQueue handles POST /api/sample/clear-queue
func (h *SampleHandler) ClearQueue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	result, err := h.sampleService.ClearQueue(actorID)
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
