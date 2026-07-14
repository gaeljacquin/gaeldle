package services

type DiscoverService struct{}

func NewDiscoverService() *DiscoverService {
	return &DiscoverService{}
}

func (s *DiscoverService) Scan(count int, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"scanEventId":       123,
		"candidates":        []interface{}{},
		"totalReturned":     0,
		"alreadyAddedCount": 0,
	}, nil
}

func (s *DiscoverService) Apply(selectedIgdbIds []int, scanEventId int, actorID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"success":      true,
		"applyEventId": 456,
		"results":      []interface{}{},
	}, nil
}
