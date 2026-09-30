package nik_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/nik"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "nik", map[string]vectortest.Func{
		"isValid": func(a []any) (any, error) { return nik.Valid(a[0].(string)), nil },
		"parse":   func(a []any) (any, error) { return nik.Parse(a[0].(string)) },
		"parseAt": func(a []any) (any, error) { return nik.ParseAt(a[0].(string), int(a[1].(float64))) },
		"format":  func(a []any) (any, error) { return nik.Format(a[0].(string)) },
		"mask":    func(a []any) (any, error) { return nik.Mask(a[0].(string)), nil },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := nik.Parse("3171013201909999"); !errors.Is(err, nik.ErrDate) {
		t.Fatalf("want ErrDate, got %v", err)
	}
	if got := nik.ErrRegion.Error(); got != "nik: invalid region" {
		t.Fatalf("message %q", got)
	}
}

func TestValidDoesNotAllocate(t *testing.T) {
	allocs := testing.AllocsPerRun(100, func() {
		nik.Valid("3171 0145 0190 9999")
	})
	if allocs != 0 {
		t.Fatalf("Valid allocates %v times", allocs)
	}
}

func BenchmarkValid(b *testing.B) {
	for b.Loop() {
		nik.Valid("3171014501909999")
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "nik") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := nik.Parse(s)
		if nik.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if masked := nik.Mask(s); strings.Count(masked, "*") < len(masked)-4 {
			t.Fatalf("mask reveals too much: %q", masked)
		}
		if err != nil {
			return
		}
		formatted, err := nik.Format(s)
		if err != nil {
			t.Fatalf("Format failed after Parse succeeded: %v", err)
		}
		again, err := nik.Parse(formatted)
		if err != nil || again != parsed {
			t.Fatalf("round trip mismatch: %+v vs %+v (%v)", parsed, again, err)
		}
	})
}
