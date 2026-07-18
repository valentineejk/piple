package helpers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// httpClient is shared across requests so connections are reused.
var httpClient = &http.Client{Timeout: 30 * time.Second}

// APIRequest describes an outbound HTTP call. Only Method and URL are required.
type APIRequest struct {
	Method  string            // GET, POST, PATCH, ...
	URL     string            // full URL
	Headers map[string]string // optional extra headers
	Query   map[string]string // optional query params, appended to URL
	Body    any               // optional; JSON-encoded unless it's []byte/string/io.Reader
}

// APIResponse is the raw result of an HTTP call.
type APIResponse struct {
	StatusCode int
	Header     http.Header
	Body       []byte
}

// OK reports whether the status is in the 2xx range.
func (r *APIResponse) OK() bool {
	return r.StatusCode >= 200 && r.StatusCode < 300
}

// JSON unmarshals the response body into target.
func (r *APIResponse) JSON(target any) error {
	if len(r.Body) == 0 {
		return nil
	}
	return json.Unmarshal(r.Body, target)
}

// Do executes an HTTP request and returns the raw response. It never fails just
// because the server returned a non-2xx status — inspect APIResponse.OK/StatusCode
// for that. It only errors on transport/encoding problems.
func Do(ctx context.Context, req APIRequest) (*APIResponse, error) {
	body, err := encodeBody(req.Body)
	if err != nil {
		return nil, fmt.Errorf("encode body: %w", err)
	}

	fullURL, err := appendQuery(req.URL, req.Query)
	if err != nil {
		return nil, fmt.Errorf("build url: %w", err)
	}

	method := req.Method
	if method == "" {
		method = http.MethodGet
	}

	httpReq, err := http.NewRequestWithContext(ctx, method, fullURL, body)
	if err != nil {
		return nil, err
	}

	// JSON by default; callers can override via Headers.
	if req.Body != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	httpReq.Header.Set("Accept", "application/json")
	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	res, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}

	return &APIResponse{
		StatusCode: res.StatusCode,
		Header:     res.Header,
		Body:       raw,
	}, nil
}

// DoJSON executes a request and decodes a 2xx response into T. A non-2xx status
// is returned as an error carrying the status code and response body.
func DoJSON[T any](ctx context.Context, req APIRequest) (T, error) {
	var out T
	res, err := Do(ctx, req)
	if err != nil {
		return out, err
	}
	if !res.OK() {
		return out, fmt.Errorf("request to %s failed: status %d: %s", req.URL, res.StatusCode, res.Body)
	}
	if err := res.JSON(&out); err != nil {
		return out, fmt.Errorf("decode response: %w", err)
	}
	return out, nil
}

func encodeBody(body any) (io.Reader, error) {
	switch b := body.(type) {
	case nil:
		return nil, nil
	case io.Reader:
		return b, nil
	case []byte:
		return bytes.NewReader(b), nil
	case string:
		return bytes.NewReader([]byte(b)), nil
	default:
		raw, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		return bytes.NewReader(raw), nil
	}
}

func appendQuery(rawURL string, query map[string]string) (string, error) {
	if len(query) == 0 {
		return rawURL, nil
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	q := u.Query()
	for k, v := range query {
		q.Set(k, v)
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}
