package services

type HexclaveService struct{}

func NewHexclaveService() *HexclaveService {
	return &HexclaveService{}
}

func (s *HexclaveService) SignInWithPassword(email, password string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"accessToken": "dummy-jwt-access-token",
		"refreshToken": "dummy-jwt-refresh-token",
		"user": map[string]interface{}{
			"id":    "dummy-user-id",
			"email": email,
		},
	}, nil
}
