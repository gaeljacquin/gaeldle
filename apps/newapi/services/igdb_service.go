package services

type IgdbService struct{}

func NewIgdbService() *IgdbService {
	return &IgdbService{}
}

func (s *IgdbService) GetGameById(igdbID int) (interface{}, error) {
	return map[string]interface{}{
		"id":   igdbID,
		"name": "Dummy IGDB Game",
	}, nil
}

func (s *IgdbService) GetGamesByIds(igdbIDs []int) (interface{}, error) {
	var result []interface{}
	for _, id := range igdbIDs {
		result = append(result, map[string]interface{}{
			"id":   id,
			"name": "Dummy IGDB Game",
		})
	}
	return result, nil
}
