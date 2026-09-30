package npwp_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/npwp"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "npwp", map[string]vectortest.Func{
		"isValid": func(a []any) (any, error) { return npwp.Valid(a[0].(string)), nil },
		"parse":   func(a []any) (any, error) { return npwp.Parse(a[0].(string)) },
		"format":  func(a []any) (any, error) { return npwp.Format(a[0].(string)) },
		"to16":    func(a []any) (any, error) { return npwp.To16(a[0].(string)) },
		"mask":    func(a []any) (any, error) { return npwp.Mask(a[0].(string)), nil },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := npwp.Parse("3171013201909999"); !errors.Is(err, npwp.ErrNIK) {
		t.Fatalf("want ErrNIK, got %v", err)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "npwp") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := npwp.Parse(s)
		if npwp.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if masked := npwp.Mask(s); strings.Count(masked, "*") < len(masked)-4 {
			t.Fatalf("mask reveals too much: %q", masked)
		}
		if err != nil {
			return
		}
		formatted, err := npwp.Format(s)
		if err != nil {
			t.Fatalf("Format failed after Parse succeeded: %v", err)
		}
		again, err := npwp.Parse(formatted)
		if err != nil || again != parsed {
			t.Fatalf("round trip mismatch: %+v vs %+v (%v)", parsed, again, err)
		}
		base, err := npwp.To16(s)
		if err != nil || base != parsed.NPWP16 {
			t.Fatalf("To16 mismatch: %q vs %q (%v)", base, parsed.NPWP16, err)
		}
	})
}
