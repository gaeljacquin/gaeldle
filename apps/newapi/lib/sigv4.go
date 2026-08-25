package lib

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// HmacSHA256 computes the HMAC-SHA256 of data using the provided key
func HmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

// SHA256Hex computes the SHA256 hex string of data
func SHA256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

// GetSignatureKey derives the AWS SigV4 signing key
func GetSignatureKey(key, dateStamp, regionName, serviceName string) []byte {
	kDate := HmacSHA256([]byte("AWS4"+key), dateStamp)
	kRegion := HmacSHA256(kDate, regionName)
	kService := HmacSHA256(kRegion, serviceName)
	kSigning := HmacSHA256(kService, "aws4_request")
	return kSigning
}

// SignRequest signs an http.Request using AWS Signature Version 4
func SignRequest(req *http.Request, body []byte, service, region, accessKeyID, secretAccessKey string, t time.Time) error {
	if region == "" {
		region = "us-east-1"
	}
	amzDate := t.UTC().Format("20060102T150405Z")
	dateStamp := t.UTC().Format("20060102")

	req.Header.Set("x-amz-date", amzDate)
	payloadHash := SHA256Hex(body)
	req.Header.Set("x-amz-content-sha256", payloadHash)

	// Host header
	host := req.Host
	if host == "" {
		host = req.URL.Host
	}

	// 1. Canonical Headers
	headersToSign := map[string]string{
		"host":                 host,
		"x-amz-date":           amzDate,
		"x-amz-content-sha256": payloadHash,
	}

	if ct := req.Header.Get("Content-Type"); ct != "" {
		headersToSign["content-type"] = ct
	}

	var signedHeaderKeys []string
	for k := range headersToSign {
		signedHeaderKeys = append(signedHeaderKeys, strings.ToLower(k))
	}
	sort.Strings(signedHeaderKeys)

	var canonicalHeaders strings.Builder
	for _, k := range signedHeaderKeys {
		canonicalHeaders.WriteString(fmt.Sprintf("%s:%s\n", k, strings.TrimSpace(headersToSign[k])))
	}
	signedHeaders := strings.Join(signedHeaderKeys, ";")

	// 2. Canonical URI and Query
	canonicalURI := req.URL.Path
	if canonicalURI == "" {
		canonicalURI = "/"
	}

	canonicalQuery := req.URL.RawQuery
	if canonicalQuery != "" {
		queryParams, _ := url.ParseQuery(canonicalQuery)
		var queryKeys []string
		for k := range queryParams {
			queryKeys = append(queryKeys, k)
		}
		sort.Strings(queryKeys)
		var canonicalQueryParts []string
		for _, k := range queryKeys {
			for _, v := range queryParams[k] {
				canonicalQueryParts = append(canonicalQueryParts, fmt.Sprintf("%s=%s", url.QueryEscape(k), url.QueryEscape(v)))
			}
		}
		canonicalQuery = strings.Join(canonicalQueryParts, "&")
	}

	// 3. Canonical Request
	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		req.Method,
		canonicalURI,
		canonicalQuery,
		canonicalHeaders.String(),
		signedHeaders,
		payloadHash,
	)

	// 4. String to Sign
	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\n%s",
		amzDate,
		credentialScope,
		SHA256Hex([]byte(canonicalRequest)),
	)

	// 5. Calculate Signature
	signingKey := GetSignatureKey(secretAccessKey, dateStamp, region, service)
	signature := hex.EncodeToString(HmacSHA256(signingKey, stringToSign))

	// 6. Add Authorization header
	authHeader := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKeyID,
		credentialScope,
		signedHeaders,
		signature,
	)
	req.Header.Set("Authorization", authHeader)

	return nil
}
