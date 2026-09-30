package nisn_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/nisn"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "nisn", map[string]vectortest.Func{
		"isValid": func(a []any) (any, error) { return nisn.Valid(a[0].(string)), nil },
		"parse":   func(a []any) (any, error) { return nisn.Parse(a[0].(string)) },
		"format":  func(a []any) (any, error) { return nisn.Format(a[0].(string)) },
		"mask":    func(a []any) (any, error) { return nisn.Mask(a[0].(string)), nil },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := nisn.Parse("0000000000"); !errors.Is(err, nisn.ErrSerial) {
		t.Fatalf("want ErrSerial, got %v", err)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "nisn") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := nisn.Parse(s)
		if nisn.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if masked := nisn.Mask(s); strings.Count(masked, "*") < len(masked)-4 {
			t.Fatalf("mask reveals too much: %q", masked)
		}
		if err != nil {
			return
		}
		formatted, err := nisn.Format(s)
		if err != nil || formatted != parsed.Number {
			t.Fatalf("format mismatch: %q vs %q (%v)", formatted, parsed.Number, err)
		}
	})
}
