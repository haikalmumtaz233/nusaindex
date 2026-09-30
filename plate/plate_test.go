package plate_test

import (
	"errors"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/plate"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "plate", map[string]vectortest.Func{
		"isValid": func(a []any) (any, error) { return plate.Valid(a[0].(string)), nil },
		"parse":   func(a []any) (any, error) { return plate.Parse(a[0].(string)) },
		"format":  func(a []any) (any, error) { return plate.Format(a[0].(string)) },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := plate.Parse("B 01234"); !errors.Is(err, plate.ErrFormat) {
		t.Fatalf("want ErrFormat, got %v", err)
	}
	if _, err := plate.Parse("XX 1"); !errors.Is(err, plate.ErrRegion) {
		t.Fatalf("want ErrRegion, got %v", err)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "plate") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := plate.Parse(s)
		if plate.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if err != nil {
			return
		}
		formatted, err := plate.Format(s)
		if err != nil {
			t.Fatalf("Format failed after Parse succeeded: %v", err)
		}
		again, err := plate.Parse(formatted)
		if err != nil || again != parsed {
			t.Fatalf("round trip mismatch: %+v vs %+v (%v)", parsed, again, err)
		}
	})
}
