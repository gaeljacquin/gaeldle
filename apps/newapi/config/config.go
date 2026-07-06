package config

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

type AppConfig struct {
	AppEnv                       string
	Port                         string
	CorsAllowedOrigins           []string
	ClientURLs                   []string
	WebProjectSuffix             string
	DatabaseURL                  string
	HexclaveProjectID            string
	HexclavePublishableClientKey string
	HexclaveSecretServerKey      string
	TwitchClientID               string
	TwitchClientSecret           string
	R2Endpoint                   string
	R2AccessKeyID                string
	R2SecretAccessKey            string
	R2BucketName                 string
	R2PublicURL                  string
	CfAccountID                  string
	CfAPIToken                   string
	AwsAccessKeyID               string
	AwsSecretAccessKey           string
	AwsRegion                    string
	SampleSqsQueueURL            string
	ImageGenSqsQueueURL          string
	ImageGenConsumerPollDelayMs  int
}

// LoadEnv loads variables from a .env file if it exists, without overriding existing env vars
func LoadEnv(filenames ...string) {
	for _, filename := range filenames {
		file, err := os.Open(filename)
		if err != nil {
			continue
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				// Don't override existing environment variables
				if os.Getenv(key) == "" {
					os.Setenv(key, value)
				}
			}
		}

		if err := scanner.Err(); err != nil {
			log.Printf("error reading %s file: %v", filename, err)
		}
	}
}

// LoadConfig gathers all configurations from the environment
func LoadConfig() (*AppConfig, error) {
	// First load from root .env and local app .env if they exist
	LoadEnv("../../.env", ".env")

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = os.Getenv("NODE_ENV")
	}
	if appEnv == "" {
		appEnv = "development"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var corsOrigins []string
	if cors := os.Getenv("CORS_ALLOWED_ORIGINS"); cors != "" {
		for _, o := range strings.Split(cors, ",") {
			corsOrigins = append(corsOrigins, strings.TrimSpace(o))
		}
	}

	var clientURLs []string
	if urls := os.Getenv("CLIENT_URLS"); urls != "" {
		for _, u := range strings.Split(urls, ",") {
			clientURLs = append(clientURLs, strings.TrimSpace(u))
		}
	}

	dbURL := os.Getenv("DATABASE_URL")

	pollDelayMs := 0
	if delayStr := os.Getenv("IMAGE_GEN_CONSUMER_POLL_DELAY_MS"); delayStr != "" {
		if val, err := strconv.Atoi(delayStr); err == nil {
			pollDelayMs = val
		}
	}

	bucketName := os.Getenv("R2_BUCKET_NAME")
	if bucketName == "" {
		return nil, fmt.Errorf("R2_BUCKET_NAME is required")
	}

	sampleSqs := os.Getenv("SAMPLE_SQS_QUEUE_URL")
	if sampleSqs == "" {
		return nil, fmt.Errorf("SAMPLE_SQS_QUEUE_URL is required")
	}

	imageGenSqs := os.Getenv("IMAGE_GEN_SQS_QUEUE_URL")
	if imageGenSqs == "" {
		return nil, fmt.Errorf("IMAGE_GEN_SQS_QUEUE_URL is required")
	}

	return &AppConfig{
		AppEnv:                       strings.ToLower(appEnv),
		Port:                         port,
		CorsAllowedOrigins:           corsOrigins,
		ClientURLs:                   clientURLs,
		WebProjectSuffix:             os.Getenv("WEB_PROJECT_SUFFIX"),
		DatabaseURL:                  dbURL,
		HexclaveProjectID:            os.Getenv("HEXCLAVE_PROJECT_ID"),
		HexclavePublishableClientKey: os.Getenv("HEXCLAVE_PUBLISHABLE_CLIENT_KEY"),
		HexclaveSecretServerKey:      os.Getenv("HEXCLAVE_SECRET_SERVER_KEY"),
		TwitchClientID:               os.Getenv("TWITCH_CLIENT_ID"),
		TwitchClientSecret:           os.Getenv("TWITCH_CLIENT_SECRET"),
		R2Endpoint:                   os.Getenv("R2_ENDPOINT"),
		R2AccessKeyID:                os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey:            os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2BucketName:                 bucketName,
		R2PublicURL:                  os.Getenv("R2_PUBLIC_URL"),
		CfAccountID:                  os.Getenv("CF_ACCOUNT_ID"),
		CfAPIToken:                   os.Getenv("CF_API_TOKEN"),
		AwsAccessKeyID:               os.Getenv("AWS_ACCESS_KEY_ID"),
		AwsSecretAccessKey:           os.Getenv("AWS_SECRET_ACCESS_KEY"),
		AwsRegion:                    os.Getenv("AWS_REGION"),
		SampleSqsQueueURL:            sampleSqs,
		ImageGenSqsQueueURL:          imageGenSqs,
		ImageGenConsumerPollDelayMs:  pollDelayMs,
	}, nil
}
