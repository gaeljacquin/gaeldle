package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"gaeldle/api/config"
)

type IgdbNameItem struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type IgdbImageItem struct {
	ID      int    `json:"id"`
	ImageID string `json:"image_id"`
	URL     string `json:"url"`
}

type IgdbInvolvedCompany struct {
	ID        int           `json:"id"`
	Company   *IgdbNameItem `json:"company"`
	Developer bool          `json:"developer"`
	Publisher bool          `json:"publisher"`
}

type IgdbReleaseDate struct {
	ID       int           `json:"id"`
	Date     *int64        `json:"date"`
	Human    string        `json:"human"`
	Platform *IgdbNameItem `json:"platform"`
}

type IgdbGame struct {
	ID                 int                   `json:"id"`
	Name               string                `json:"name"`
	Summary            *string               `json:"summary"`
	Storyline          *string               `json:"storyline"`
	URL                string                `json:"url"`
	TotalRating        *float64              `json:"total_rating"`
	TotalRatingCount   *int                  `json:"total_rating_count"`
	FirstReleaseDate   *int64                `json:"first_release_date"`
	Cover              *IgdbImageItem        `json:"cover"`
	Artworks           []IgdbImageItem       `json:"artworks"`
	Keywords           []IgdbNameItem        `json:"keywords"`
	Franchises         []IgdbNameItem        `json:"franchises"`
	GameEngines        []IgdbNameItem        `json:"game_engines"`
	GameModes          []IgdbNameItem        `json:"game_modes"`
	Genres             []IgdbNameItem        `json:"genres"`
	InvolvedCompanies  []IgdbInvolvedCompany `json:"involved_companies"`
	Platforms          []IgdbNameItem        `json:"platforms"`
	PlayerPerspectives []IgdbNameItem        `json:"player_perspectives"`
	ReleaseDates       []IgdbReleaseDate     `json:"release_dates"`
	Themes             []IgdbNameItem        `json:"themes"`
	Category           int                   `json:"category"`
	Status             int                   `json:"status"`
}

type IgdbService struct {
	twitchClientID     string
	twitchClientSecret string
	accessToken        string
	accessTokenExpires time.Time
	mu                 sync.Mutex
	client             *http.Client
}

func NewIgdbService(cfg *config.AppConfig) *IgdbService {
	return &IgdbService{
		twitchClientID:     cfg.TwitchClientID,
		twitchClientSecret: cfg.TwitchClientSecret,
		client:             &http.Client{Timeout: 15 * time.Second},
	}
}

func (s *IgdbService) getAccessToken() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.accessToken != "" && time.Now().Before(s.accessTokenExpires) {
		return s.accessToken, nil
	}

	if s.twitchClientID == "" || s.twitchClientSecret == "" {
		return "", fmt.Errorf("twitch credentials not configured")
	}

	params := url.Values{}
	params.Set("client_id", s.twitchClientID)
	params.Set("client_secret", s.twitchClientSecret)
	params.Set("grant_type", "client_credentials")

	tokenURL := fmt.Sprintf("https://id.twitch.tv/oauth2/token?%s", params.Encode())
	resp, err := s.client.Post(tokenURL, "application/json", nil)
	if err != nil {
		return "", fmt.Errorf("failed to request Twitch token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("twitch token endpoint returned status %d", resp.StatusCode)
	}

	var data struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", fmt.Errorf("failed to decode Twitch token response: %w", err)
	}

	s.accessToken = data.AccessToken
	// Subtract 60 seconds buffer
	s.accessTokenExpires = time.Now().Add(time.Duration(data.ExpiresIn-60) * time.Second)
	return s.accessToken, nil
}

func (s *IgdbService) GetGameById(igdbID int) (*IgdbGame, error) {
	games, err := s.GetGamesByIds([]int{igdbID})
	if err != nil {
		return nil, err
	}
	if len(games) == 0 {
		return nil, nil
	}
	return games[0], nil
}

func (s *IgdbService) GetGamesByIds(igdbIDs []int) ([]*IgdbGame, error) {
	if len(igdbIDs) == 0 {
		return []*IgdbGame{}, nil
	}

	token, err := s.getAccessToken()
	if err != nil {
		return nil, err
	}

	var idStrs []string
	for _, id := range igdbIDs {
		idStrs = append(idStrs, strconv.Itoa(id))
	}

	query := fmt.Sprintf(`
		fields id, name, summary, storyline, url, total_rating, total_rating_count,
		       first_release_date, cover.image_id, cover.url,
		       artworks.image_id, artworks.url, keywords.name, franchises.name,
		       game_engines.name, game_modes.name, genres.name,
		       involved_companies.company.name, involved_companies.publisher, involved_companies.developer,
		       platforms.name, player_perspectives.name, release_dates.human, release_dates.date, release_dates.platform.name,
		       themes.id, themes.name, category, status;
		where id = (%s);
		limit %d;
	`, strings.Join(idStrs, ","), len(igdbIDs))

	req, err := http.NewRequest("POST", "https://api.igdb.com/v4/games", strings.NewReader(query))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Client-ID", s.twitchClientID)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "text/plain")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("IGDB request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IGDB API returned status: %d", resp.StatusCode)
	}

	var games []*IgdbGame
	if err := json.NewDecoder(resp.Body).Decode(&games); err != nil {
		return nil, fmt.Errorf("failed to decode IGDB response: %w", err)
	}

	return games, nil
}

func (s *IgdbService) DiscoverCandidates(limit int) ([]*IgdbGame, error) {
	token, err := s.getAccessToken()
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`
		fields id, name, summary, storyline, url, total_rating, total_rating_count,
		       first_release_date, cover.image_id, cover.url,
		       artworks.image_id, artworks.url, keywords.name, franchises.name,
		       game_engines.name, game_modes.name, genres.name,
		       involved_companies.company.name, involved_companies.publisher, involved_companies.developer,
		       platforms.name, player_perspectives.name, release_dates.human, release_dates.date, release_dates.platform.name,
		       themes.id, themes.name, category, status;
		where total_rating_count > 50 & cover != null;
		sort total_rating desc;
		limit %d;
	`, limit)

	req, err := http.NewRequest("POST", "https://api.igdb.com/v4/games", strings.NewReader(query))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Client-ID", s.twitchClientID)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "text/plain")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("IGDB request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IGDB API returned status: %d", resp.StatusCode)
	}

	var games []*IgdbGame
	if err := json.NewDecoder(resp.Body).Decode(&games); err != nil {
		return nil, fmt.Errorf("failed to decode IGDB response: %w", err)
	}

	return games, nil
}
