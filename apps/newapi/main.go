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
	"gaeldle/newapi/middleware"
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
	igdbService := services.NewIgdbService(cfg)
	gamesService := services.NewGamesService(database, igdbService)
	aiService := services.NewAiService(cfg)
	s3Service := services.NewS3Service(cfg)
	r2Service := services.NewR2Service(cfg)
	sqsService := services.NewSqsService(cfg)
	hexclaveService := services.NewHexclaveService(cfg)
	discoverService := services.NewDiscoverService(database, igdbService, gamesService)
	imageGenService := services.NewImageGenService(database, sqsService, r2Service, gamesService, cfg)
	sampleService := services.NewSampleService(sqsService, s3Service, r2Service, cfg)

	log.Printf("Services initialized: IGDB=%p, AI=%p, S3=%p, R2=%p, SQS=%p\n",
		igdbService, aiService, s3Service, r2Service, sqsService)

	// 4. Instantiate handlers
	healthHandler := handlers.NewHealthHandler(database)
	gamesHandler := handlers.NewGamesHandler(gamesService)
	discoverHandler := handlers.NewDiscoverHandler(discoverService)
	imageGenHandler := handlers.NewImageGenHandler(imageGenService)
	sampleHandler := handlers.NewSampleHandler(sampleService)
	authHandler := handlers.NewAuthHandler(hexclaveService)

	// 5. Setup Router
	mux := http.NewServeMux()
	authMiddleware := middleware.HexclaveAuth(cfg)

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

	// Games Endpoints - Public Reads
	mux.HandleFunc("GET /api/games", gamesHandler.GetGames)
	mux.HandleFunc("GET /api/games/random", gamesHandler.GetRandomGame)
	mux.HandleFunc("GET /api/games/search", gamesHandler.SearchGames)
	mux.HandleFunc("GET /api/private/games/{igdbId}", gamesHandler.GetGameByIgdbId)

	// Games Endpoints - Protected Writes
	mux.Handle("POST /api/games/sync", authMiddleware(http.HandlerFunc(gamesHandler.SyncGame)))
	mux.Handle("PATCH /api/games/{id}", authMiddleware(http.HandlerFunc(gamesHandler.UpdateGame)))
	mux.Handle("DELETE /api/games/{id}", authMiddleware(http.HandlerFunc(gamesHandler.DeleteGame)))
	mux.Handle("DELETE /api/games/bulk", authMiddleware(http.HandlerFunc(gamesHandler.DeleteBulk)))
	mux.Handle("POST /api/games/add/validate-one", authMiddleware(http.HandlerFunc(gamesHandler.ValidateIgdbIdAdd)))
	mux.Handle("POST /api/games/test-upload", authMiddleware(http.HandlerFunc(gamesHandler.TestUpload)))
	mux.Handle("POST /api/test/send-message", authMiddleware(http.HandlerFunc(gamesHandler.TestSendMessage)))

	// Discover Endpoints - Protected
	mux.Handle("POST /api/discover/scan", authMiddleware(http.HandlerFunc(discoverHandler.Scan)))
	mux.Handle("POST /api/discover/apply", authMiddleware(http.HandlerFunc(discoverHandler.Apply)))

	// Image Generation Endpoints - Protected
	mux.Handle("POST /api/image-gen/generate-image", authMiddleware(http.HandlerFunc(imageGenHandler.GenerateImage)))
	mux.Handle("POST /api/image-gen/generate-images", authMiddleware(http.HandlerFunc(imageGenHandler.GenerateImages)))
	mux.Handle("GET /api/image-gen/generate-images/{imageGenId}/status", authMiddleware(http.HandlerFunc(imageGenHandler.GetImageGenStatus)))
	mux.Handle("GET /api/image-gen/generate-images/{imageGenId}/stream", authMiddleware(http.HandlerFunc(imageGenHandler.Stream)))

	// Sample Endpoints - Protected
	mux.Handle("POST /api/sample/upload-image", authMiddleware(http.HandlerFunc(sampleHandler.UploadImage)))
	mux.Handle("POST /api/sample/send-message", authMiddleware(http.HandlerFunc(sampleHandler.SendMessage)))
	mux.Handle("POST /api/sample/clear-queue", authMiddleware(http.HandlerFunc(sampleHandler.ClearQueue)))

	// 6. Wrap router in middlewares
	handlerChain := loggingMiddleware(corsMiddleware(cfg, mux))

	// 7. Start HTTP Server
	port := cfg.Port
	log.Printf("Server starting on :%s...\n", port)
	if err := http.ListenAndServe(":"+port, handlerChain); err != nil {
		log.Fatal(err)
	}
}
