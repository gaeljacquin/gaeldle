package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gaeldle/newapi/middleware"
	"gaeldle/newapi/services"
)

type ImageGenHandler struct {
	imageGenService *services.ImageGenService
}

func NewImageGenHandler(imageGenService *services.ImageGenService) *ImageGenHandler {
	return &ImageGenHandler{imageGenService: imageGenService}
}

// GenerateImage handles POST /api/image-gen/generate-image
func (h *ImageGenHandler) GenerateImage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	result, err := h.imageGenService.GenerateImage(body, actorID)
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

// GenerateImages handles POST /api/image-gen/generate-images
func (h *ImageGenHandler) GenerateImages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	actorID := middleware.GetActorID(r)

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	result, err := h.imageGenService.GenerateImages(body, actorID)
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

// GetImageGenStatus handles GET /api/image-gen/generate-images/{imageGenId}/status
func (h *ImageGenHandler) GetImageGenStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	imageGenID := r.PathValue("imageGenId")

	result, err := h.imageGenService.GetImageGenStatus(imageGenID)
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

// Stream handles SSE streaming: GET /api/image-gen/generate-images/{imageGenId}/stream
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
