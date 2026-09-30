package phone_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/phone"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "phone", map[string]vectortest.Func{
		"isValid":      func(a []any) (any, error) { return phone.Valid(a[0].(string)), nil },
		"parse":        func(a []any) (any, error) { return phone.Parse(a[0].(string)) },
		"format":       func(a []any) (any, error) { return phone.Format(a[0].(string)) },
		"whatsappLink": func(a []any) (any, error) { return phone.WhatsAppLink(a[0].(string)) },
		"mask":         func(a []any) (any, error) { return phone.Mask(a[0].(string)), nil },
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := phone.Parse("+1 212 555 0100"); !errors.Is(err, phone.ErrCountry) {
		t.Fatalf("want ErrCountry, got %v", err)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "phone") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		parsed, err := phone.Parse(s)
		if phone.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		masked := phone.Mask(s)
		if visible := len(masked) - strings.Count(masked, "*"); err == nil && visible != len("+62")+3 {
			t.Fatalf("mask reveals too much: %q", masked)
		}
		if err != nil {
			return
		}
		again, err := phone.Parse(parsed.E164)
		if err != nil || again != parsed {
			t.Fatalf("round trip mismatch: %+v vs %+v (%v)", parsed, again, err)
		}
		national, err := phone.Parse(parsed.National)
		if err != nil || national != parsed {
			t.Fatalf("national round trip mismatch: %+v vs %+v (%v)", parsed, national, err)
		}
	})
}
