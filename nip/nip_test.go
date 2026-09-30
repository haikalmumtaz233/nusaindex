package nip_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/nip"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "nip", map[string]vectortest.Func{
		"isValid": func(a []any) (any, error) { return nip.Valid(a[0].(string)), nil },
		"parse":   func(a []any) (any, error) { return nip.Parse(a[0].(string)) },
		"format":  func(a []any) (any, error) { return nip.Format(a[0].(string)) },
		"mask":    func(a []any) (any, error) { return nip.Mask(a[0].(string)), nil },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := nip.Parse("199001052015033999"); !errors.Is(err, nip.ErrSex) {
		t.Fatalf("want ErrSex, got %v", err)
	}
}

func TestValidDoesNotAllocate(t *testing.T) {
	allocs := testing.AllocsPerRun(100, func() {
		nip.Valid("19900105 201503 1 999")
	})
	if allocs != 0 {
		t.Fatalf("Valid allocates %v times", allocs)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "nip") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := nip.Parse(s)
		if nip.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if masked := nip.Mask(s); strings.Count(masked, "*") < len(masked)-4 {
			t.Fatalf("mask reveals too much: %q", masked)
		}
		if err != nil {
			return
		}
		formatted, err := nip.Format(s)
		if err != nil {
			t.Fatalf("Format failed after Parse succeeded: %v", err)
		}
		again, err := nip.Parse(formatted)
		if err != nil || again != parsed {
			t.Fatalf("round trip mismatch: %+v vs %+v (%v)", parsed, again, err)
		}
	})
}
