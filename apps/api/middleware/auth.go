package middleware

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"gaeldle/api/config"
)

type contextKey string

const (
	ActorIDKey contextKey = "actorId"
)

func GetActorID(r *http.Request) string {
	if val, ok := r.Context().Value(ActorIDKey).(string); ok && val != "" {
		return val
	}
	return "unknown"
}

type JWK struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWTCache struct {
	mu        sync.RWMutex
	jwks      *JWKS
	fetchedAt time.Time
}

var jwksCache = &JWTCache{}

func fetchJWKS(projectID string) (*JWKS, error) {
	apiBaseURL := os.Getenv("HEXCLAVE_API_URL")
	if apiBaseURL == "" {
		apiBaseURL = "https://api.hexclave.com"
	}
	jwksURL := fmt.Sprintf("%s/api/v1/projects/%s/.well-known/jwks.json", apiBaseURL, projectID)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS endpoint returned status %d", resp.StatusCode)
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS JSON: %w", err)
	}

	return &jwks, nil
}

func getJWKS(projectID string, forceRefresh bool) (*JWKS, error) {
	jwksCache.mu.RLock()
	if !forceRefresh && jwksCache.jwks != nil && time.Since(jwksCache.fetchedAt) < time.Hour {
		defer jwksCache.mu.RUnlock()
		return jwksCache.jwks, nil
	}
	jwksCache.mu.RUnlock()

	jwksCache.mu.Lock()
	defer jwksCache.mu.Unlock()

	// Double check
	if !forceRefresh && jwksCache.jwks != nil && time.Since(jwksCache.fetchedAt) < time.Hour {
		return jwksCache.jwks, nil
	}

	jwks, err := fetchJWKS(projectID)
	if err != nil {
		return nil, err
	}

	jwksCache.jwks = jwks
	jwksCache.fetchedAt = time.Now()
	return jwks, nil
}

func decodeBase64URL(s string) ([]byte, error) {
	// Add padding if needed
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}

func parseRSAPublicKey(nStr, eStr string) (*rsa.PublicKey, error) {
	nBytes, err := decodeBase64URL(nStr)
	if err != nil {
		return nil, fmt.Errorf("invalid n: %w", err)
	}
	eBytes, err := decodeBase64URL(eStr)
	if err != nil {
		return nil, fmt.Errorf("invalid e: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	var e int
	for _, b := range eBytes {
		e = (e << 8) | int(b)
	}

	return &rsa.PublicKey{
		N: n,
		E: e,
	}, nil
}

type JWTClaims struct {
	Sub string      `json:"sub"`
	Aud interface{} `json:"aud"`
	Exp int64       `json:"exp"`
	Iat int64       `json:"iat"`
	Iss string      `json:"iss"`
}

func verifyJWT(tokenStr, projectID string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	headerBytes, err := decodeBase64URL(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid header base64: %w", err)
	}

	var header struct {
		Kid string `json:"kid"`
		Alg string `json:"alg"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, fmt.Errorf("invalid header JSON: %w", err)
	}

	if header.Alg != "RS256" && header.Alg != "" {
		return nil, fmt.Errorf("unsupported algorithm: %s", header.Alg)
	}

	jwks, err := getJWKS(projectID, false)
	if err != nil {
		return nil, fmt.Errorf("unable to load JWKS: %w", err)
	}

	var matchingKey *JWK
	for _, k := range jwks.Keys {
		if k.Kid == header.Kid || header.Kid == "" {
			matchingKey = &k
			break
		}
	}

	if matchingKey == nil {
		// Try refreshing JWKS once
		jwks, err = getJWKS(projectID, true)
		if err == nil {
			for _, k := range jwks.Keys {
				if k.Kid == header.Kid {
					matchingKey = &k
					break
				}
			}
		}
	}

	if matchingKey == nil {
		return nil, fmt.Errorf("key id %s not found in JWKS", header.Kid)
	}

	pubKey, err := parseRSAPublicKey(matchingKey.N, matchingKey.E)
	if err != nil {
		return nil, fmt.Errorf("invalid public key: %w", err)
	}

	signedContent := parts[0] + "." + parts[1]
	sigBytes, err := decodeBase64URL(parts[2])
	if err != nil {
		return nil, fmt.Errorf("invalid signature base64: %w", err)
	}

	h := sha256.New()
	h.Write([]byte(signedContent))
	hashed := h.Sum(nil)

	if err := rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, hashed, sigBytes); err != nil {
		return nil, fmt.Errorf("signature verification failed: %w", err)
	}

	payloadBytes, err := decodeBase64URL(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid payload base64: %w", err)
	}

	var claims JWTClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid payload JSON: %w", err)
	}

	// Validate exp
	if claims.Exp > 0 && time.Now().Unix() > claims.Exp {
		return nil, fmt.Errorf("token is expired")
	}

	// Validate aud
	audMatches := false
	switch aud := claims.Aud.(type) {
	case string:
		if aud == projectID {
			audMatches = true
		}
	case []interface{}:
		for _, a := range aud {
			if aStr, ok := a.(string); ok && aStr == projectID {
				audMatches = true
				break
			}
		}
	}

	if !audMatches && projectID != "" {
		return nil, fmt.Errorf("audience mismatch")
	}

	return &claims, nil
}

func extractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	}

	if stackToken := r.Header.Get("x-stack-access-token"); stackToken != "" {
		return stackToken
	}

	return ""
}

// HexclaveAuth returns a middleware that validates the Hexclave JWT token
func HexclaveAuth(cfg *config.AppConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rawToken := extractToken(r)
			if rawToken == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"error":   "Missing Hexclave access token",
				})
				return
			}

			token := rawToken
			if strings.HasPrefix(token, "stackauth_") {
				base64Part := strings.TrimPrefix(token, "stackauth_")
				jsonBytes, err := base64.StdEncoding.DecodeString(base64Part)
				if err == nil {
					var parsed struct {
						AccessToken string `json:"accessToken"`
					}
					if err := json.Unmarshal(jsonBytes, &parsed); err == nil && parsed.AccessToken != "" {
						token = parsed.AccessToken
					}
				}
			}

			projectID := cfg.HexclaveProjectID
			claims, err := verifyJWT(token, projectID)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"error":   fmt.Sprintf("Invalid Hexclave access token: %v", err),
				})
				return
			}

			actorID := claims.Sub
			if actorID == "" {
				actorID = "unknown"
			}

			ctx := context.WithValue(r.Context(), ActorIDKey, actorID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
