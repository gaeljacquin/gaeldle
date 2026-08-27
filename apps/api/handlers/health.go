package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

type HealthResponse struct {
	Status  string                 `json:"status"`
	Info    map[string]interface{} `json:"info,omitempty"`
	Error   map[string]interface{} `json:"error,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Execute health check SELECT 1 query
	var one int
	err := h.db.QueryRow("SELECT 1").Scan(&one)

	response := HealthResponse{
		Info:    make(map[string]interface{}),
		Error:   make(map[string]interface{}),
		Details: make(map[string]interface{}),
	}

	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		response.Status = "error"
		dbStatus := map[string]interface{}{
			"status":  "down",
			"message": err.Error(),
		}
		response.Info["database"] = dbStatus
		response.Error["database"] = dbStatus
		response.Details["database"] = dbStatus
	} else {
		w.WriteHeader(http.StatusOK)
		response.Status = "ok"
		dbStatus := map[string]interface{}{
			"status": "up",
		}
		response.Info["database"] = dbStatus
		response.Details["database"] = dbStatus
	}

	json.NewEncoder(w).Encode(response)
}
