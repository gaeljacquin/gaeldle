package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"gaeldle/newapi/config"
	"gaeldle/newapi/db"
	"gaeldle/newapi/handlers"
	"gaeldle/newapi/services"
)

// corsMiddleware wraps an http.Handler adding CORS headers and handling preflights
func corsMiddleware(cfg *config.AppConfig, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		isAllowed := false

		// Check if Origin is allowed
		if len(cfg.ClientURLs) == 1 && cfg.ClientURLs[0] == "*" {
			isAllowed = true
		} else if origin != "" {
			for _, u := range cfg.ClientURLs {
				if u == origin {
					isAllowed = true
					break
				}
			}
			for _, u := range cfg.CorsAllowedOrigins {
				if u == origin {
					isAllowed = true
					break
				}
			}

			// Allow Vercel preview deployments
			if !isAllowed && cfg.WebProjectSuffix != "" &&
				strings.HasPrefix(origin, "https://gaeldle-") &&
				strings.HasSuffix(origin, "-"+cfg.WebProjectSuffix+".vercel.app") {
				isAllowed = true
			}
		}

		if isAllowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS, HEAD")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-stack-access-token, x-stack-access-type, x-stack-project-id, x-stack-publishable-client-key, x-stack-auth, X-Requested-With, Accept, Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			if isAllowed {
				w.WriteHeader(http.StatusOK)
				return
			}
			w.WriteHeader(http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// loggingMiddleware logs incoming HTTP requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

func main() {
	// 1. Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}
	log.Printf("Starting gaeldle Go API (newapi) in %s environment...\n", cfg.AppEnv)

	// 2. Initialize database
	var database *sql.DB
	if cfg.DatabaseURL != "" {
		database, err = db.InitDB(cfg.DatabaseURL)
		if err != nil {
			log.Printf("WARNING: Failed to connect to database: %v. Database-reliant endpoints will fail.\n", err)
		}
	} else {
		log.Println("WARNING: DATABASE_URL is empty. Database-reliant endpoints will fail.")
	}

	// 3. Instantiate services
	gamesService := services.NewGamesService(database)
	igdbService := services.NewIgdbService()
	aiService := services.NewAiService()
	s3Service := services.NewS3Service()
	r2Service := services.NewR2Service(cfg.R2PublicURL)
	sqsService := services.NewSqsService()
	hexclaveService := services.NewHexclaveService()
	discoverService := services.NewDiscoverService()
	imageGenService := services.NewImageGenService()
	sampleService := services.NewSampleService()

	// Suppress unused warnings by logging basic info
	log.Printf("Loaded services: IGDB=%p, AI=%p, S3=%p, R2=%p, SQS=%p\n", 
		igdbService, aiService, s3Service, r2Service, sqsService)

	// 4. Instantiate handlers
	healthHandler := handlers.NewHealthHandler(database)
	gamesHandler := handlers.NewGamesHandler(gamesService)
	discoverHandler := handlers.NewDiscoverHandler(discoverService)
	imageGenHandler := handlers.NewImageGenHandler(imageGenService)
	sampleHandler := handlers.NewSampleHandler(sampleService)
	authHandler := handlers.NewAuthHandler(hexclaveService)

	// 5. Setup Router (using Go 1.22's enhanced pattern matching)
	mux := http.NewServeMux()

	// Root AppController route
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Hello World!"})
	})

	// Health Check
	mux.HandleFunc("GET /health", healthHandler.Check)
	mux.HandleFunc("GET /api/health", healthHandler.Check)

	// Auth Endpoints
	mux.HandleFunc("POST /api/auth/hexclave", authHandler.HexclaveSignIn)

	// Games Endpoints
	// Reads (Real Functionality)
	mux.HandleFunc("GET /api/games", gamesHandler.GetGames)
	mux.HandleFunc("GET /api/games/random", gamesHandler.GetRandomGame)
	mux.HandleFunc("GET /api/games/search", gamesHandler.SearchGames)
	mux.HandleFunc("GET /api/private/games/{igdbId}", gamesHandler.GetGameByIgdbId)

	// Writes (Dummy/Stubs)
	mux.HandleFunc("POST /api/games/sync", gamesHandler.SyncGame)
	mux.HandleFunc("PATCH /api/games/{id}", gamesHandler.UpdateGame)
	mux.HandleFunc("DELETE /api/games/{id}", gamesHandler.DeleteGame)
	mux.HandleFunc("DELETE /api/games/bulk", gamesHandler.DeleteBulk)
	mux.HandleFunc("POST /api/games/add/validate-one", gamesHandler.ValidateIgdbIdAdd)
	mux.HandleFunc("POST /api/games/test-upload", gamesHandler.TestUpload)
	mux.HandleFunc("POST /api/test/send-message", gamesHandler.TestSendMessage)

	// Discover Endpoints (Dummy/Stubs)
	mux.HandleFunc("POST /api/discover/scan", discoverHandler.Scan)
	mux.HandleFunc("POST /api/discover/apply", discoverHandler.Apply)

	// Image Generation Endpoints (Dummy/Stubs)
	mux.HandleFunc("POST /api/image-gen/generate-image", imageGenHandler.GenerateImage)
	mux.HandleFunc("POST /api/image-gen/generate-images", imageGenHandler.GenerateImages)
	mux.HandleFunc("GET /api/image-gen/generate-images/{imageGenId}/status", imageGenHandler.GetImageGenStatus)
	mux.HandleFunc("GET /api/image-gen/generate-images/{imageGenId}/stream", imageGenHandler.Stream)

	// Sample Endpoints (Dummy/Stubs)
	mux.HandleFunc("POST /api/sample/upload-image", sampleHandler.UploadImage)
	mux.HandleFunc("POST /api/sample/send-message", sampleHandler.SendMessage)
	mux.HandleFunc("POST /api/sample/clear-queue", sampleHandler.ClearQueue)

	// 6. Wrap router in middlewares
	handlerChain := loggingMiddleware(corsMiddleware(cfg, mux))

	// 7. Start HTTP Server
	port := cfg.Port
	log.Printf("Server starting on :%s...\n", port)
	if err := http.ListenAndServe(":"+port, handlerChain); err != nil {
		log.Fatal(err)
	}
}
