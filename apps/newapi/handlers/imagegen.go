package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gaeldle/newapi/services"
)

type ImageGenHandler struct {
	imageGenService *services.ImageGenService
}

func NewImageGenHandler(imageGenService *services.ImageGenService) *ImageGenHandler {
	return &ImageGenHandler{imageGenService: imageGenService}
}

// GenerateImage dummy implementation: POST /api/image-gen/generate-image
func (h *ImageGenHandler) GenerateImage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.imageGenService.GenerateImage(body, "unknown")
	json.NewEncoder(w).Encode(result)
}

// GenerateImages dummy implementation: POST /api/image-gen/generate-images
func (h *ImageGenHandler) GenerateImages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var body map[string]interface{}
	_ = json.NewDecoder(r.Body).Decode(&body)

	result, _ := h.imageGenService.GenerateImages(body, "unknown")
	json.NewEncoder(w).Encode(result)
}

// GetImageGenStatus dummy implementation: GET /api/image-gen/generate-images/{imageGenId}/status
func (h *ImageGenHandler) GetImageGenStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	imageGenId := r.PathValue("imageGenId")

	result, _ := h.imageGenService.GetImageGenStatus(imageGenId)
	json.NewEncoder(w).Encode(result)
}

// Stream dummy SSE implementation: GET /api/image-gen/generate-images/{imageGenId}/stream
func (h *ImageGenHandler) Stream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	payload := map[string]interface{}{
		"type": "completed",
		"data": map[string]interface{}{
			"succeeded": 1,
			"failed":    0,
			"failures":  []interface{}{},
		},
	}
	bytes, _ := json.Marshal(payload)
	fmt.Fprintf(w, "data: %s\n\n", string(bytes))
	flusher.Flush()
}
