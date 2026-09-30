package bank_test

import (
	"errors"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/bank"
	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "bank", map[string]vectortest.Func{
		"list":   func([]any) (any, error) { return bank.List(), nil },
		"byCode": func(a []any) (any, error) { return bank.ByCode(a[0].(string)) },
		"byBic":  func(a []any) (any, error) { return bank.ByBIC(a[0].(string)) },
	})
}

func TestListIsACopy(t *testing.T) {
	first := bank.List()
	first[0].Name = "changed"
	if bank.List()[0].Name == "changed" {
		t.Fatal("List exposes shared state")
	}
}

func TestSentinelErrors(t *testing.T) {
	if _, err := bank.ByCode("999"); !errors.Is(err, bank.ErrUnknown) {
		t.Fatalf("want ErrUnknown, got %v", err)
	}
}

func FuzzByBIC(f *testing.F) {
	for _, s := range vectortest.Strings(f, "bank") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		b, err := bank.ByBIC(s)
		if err == nil && len(b.BIC) != 8 {
			t.Fatalf("ByBIC(%q) = %v", s, b)
		}
	})
}
