package helpers

import (
	"regexp"
	"testing"
)

var salaryCodeRe = regexp.MustCompile(`^SAL-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$`)

func TestGenerateSalaryCode(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 1000; i++ {
		code, err := GenerateSalaryCode()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !salaryCodeRe.MatchString(code) {
			t.Fatalf("code %q does not match expected format", code)
		}
		if seen[code] {
			t.Fatalf("duplicate code generated: %q", code)
		}
		seen[code] = true
	}
}
