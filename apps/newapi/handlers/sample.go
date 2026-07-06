package handlers

import (
	"encoding/json"
	"net/http"

	"gaeldle/newapi/services"
)

type SampleHandler struct {
	sampleService *services.SampleService
}

func NewSampleHandler(sampleService *services.SampleService) *SampleHandler {
	return &SampleHandler{sampleService: sampleService}
}

// UploadImage dummy implementation: POST /api/sample/upload-image
func (h *SampleHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.sampleService.UploadImage(body, "unknown")
	json.NewEncoder(w).Encode(result)
}

// SendMessage dummy implementation: POST /api/sample/send-message
func (h *SampleHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.sampleService.SendMessage(body, "unknown")
	json.NewEncoder(w).Encode(result)
}

// ClearQueue dummy implementation: POST /api/sample/clear-queue
func (h *SampleHandler) ClearQueue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	result, _ := h.sampleService.ClearQueue("unknown")
	json.NewEncoder(w).Encode(result)
}
