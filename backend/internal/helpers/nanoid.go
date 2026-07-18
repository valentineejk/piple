package helpers

import gonanoid "github.com/matoous/go-nanoid/v2"

// salaryCodeAlphabet excludes ambiguous characters (0/O, 1/I/L) so codes are
// easy to read and transcribe.
const salaryCodeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

// GenerateSalaryCode returns a human-friendly, collision-resistant code such as
// "SAL-7QK2M9XR" using a nano id body.
func GenerateSalaryCode() (string, error) {
	id, err := gonanoid.Generate(salaryCodeAlphabet, 8)
	if err != nil {
		return "", err
	}
	return "SAL-" + id, nil
}
