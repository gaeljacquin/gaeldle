package models

import (
	"encoding/json"
	"time"
)

type Game struct {
	ID                 int             `json:"id"`
	IgdbID             int             `json:"igdbId"`
	Name               string          `json:"name"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
	ImageURL           *string         `json:"imageUrl"`
	AiImageURL         *string         `json:"aiImageUrl"`
	AiPrompt           *string         `json:"aiPrompt"`
	ImageGen           json.RawMessage `json:"imageGen"`
	InfoGen            json.RawMessage `json:"infoGen"`
	Artworks           json.RawMessage `json:"artworks"`
	Keywords           json.RawMessage `json:"keywords"`
	Franchises         json.RawMessage `json:"franchises"`
	GameEngines        json.RawMessage `json:"gameEngines"`
	GameModes          json.RawMessage `json:"gameModes"`
	Genres             json.RawMessage `json:"genres"`
	InvolvedCompanies  json.RawMessage `json:"involvedCompanies"`
	Platforms          json.RawMessage `json:"platforms"`
	PlayerPerspectives json.RawMessage `json:"playerPerspectives"`
	ReleaseDates       json.RawMessage `json:"releaseDates"`
	Themes             json.RawMessage `json:"themes"`
	FirstReleaseDate   *int64          `json:"firstReleaseDate"`
	Summary            *string         `json:"summary"`
	Storyline          *string         `json:"storyline"`
}
