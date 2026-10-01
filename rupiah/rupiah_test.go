package rupiah_test

import (
	"errors"
	"math"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/rupiah"
)

func amount(v any) rupiah.Amount {
	f := v.(float64)
	whole := math.Trunc(f)
	return rupiah.Amount(whole)*rupiah.Rupiah + rupiah.Amount(math.Round((f-whole)*100))
}

func number(a rupiah.Amount) float64 {
	if a%rupiah.Rupiah == 0 {
		return float64(a / rupiah.Rupiah)
	}
	return float64(a) / 100
}

func options(args []any) rupiah.Options {
	var o rupiah.Options
	if len(args) < 2 {
		return o
	}
	m, _ := args[1].(map[string]any)
	o.Decimals, _ = m["decimals"].(bool)
	if symbol, ok := m["symbol"].(bool); ok {
		o.OmitSymbol = !symbol
	}
	return o
}

func TestVectors(t *testing.T) {
	vectortest.Run(t, "rupiah", map[string]vectortest.Func{
		"format":    func(a []any) (any, error) { return rupiah.Format(amount(a[0]), options(a)) },
		"isValid":   func(a []any) (any, error) { return rupiah.Valid(a[0].(string)), nil },
		"terbilang": func(a []any) (any, error) { return rupiah.Terbilang(amount(a[0])) },
		"parse": func(a []any) (any, error) {
			v, err := rupiah.Parse(a[0].(string))
			return number(v), err
		},
	})
}

func TestSentinelErrors(t *testing.T) {
	if _, err := rupiah.Parse("Rp1.50"); !errors.Is(err, rupiah.ErrFormat) {
		t.Fatalf("want ErrFormat, got %v", err)
	}
	if _, err := rupiah.Format(math.MinInt64, rupiah.Options{}); !errors.Is(err, rupiah.ErrRange) {
		t.Fatalf("want ErrRange, got %v", err)
	}
	if _, err := rupiah.Terbilang(rupiah.MaxAmount + rupiah.Sen); !errors.Is(err, rupiah.ErrRange) {
		t.Fatalf("want ErrRange, got %v", err)
	}
}

func TestUnits(t *testing.T) {
	got, err := rupiah.Format(150_000*rupiah.Rupiah+25*rupiah.Sen, rupiah.Options{})
	if err != nil || got != "Rp150.000,25" {
		t.Fatalf("Format = %q, %v", got, err)
	}
}

func FuzzParse(f *testing.F) {
	for _, s := range vectortest.Strings(f, "rupiah") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		a, err := rupiah.Parse(s)
		if rupiah.Valid(s) != (err == nil) {
			t.Fatalf("Valid and Parse disagree for %q", s)
		}
		if err != nil {
			return
		}
		formatted, err := rupiah.Format(a, rupiah.Options{Decimals: true})
		if err != nil {
			t.Fatalf("Format(%d): %v", a, err)
		}
		back, err := rupiah.Parse(formatted)
		if err != nil || back != a {
			t.Fatalf("round trip %q -> %q -> %d (%v), want %d", s, formatted, back, err, a)
		}
		if _, err := rupiah.Terbilang(a); err != nil {
			t.Fatalf("Terbilang(%d): %v", a, err)
		}
	})
}

func FuzzAmount(f *testing.F) {
	f.Add(int64(0))
	f.Add(int64(rupiah.MaxAmount))
	f.Add(int64(rupiah.MaxSenAmount))
	f.Fuzz(func(t *testing.T, n int64) {
		a := rupiah.Amount(n)
		formatted, fErr := rupiah.Format(a, rupiah.Options{})
		_, tErr := rupiah.Terbilang(a)
		if (fErr == nil) != (tErr == nil) {
			t.Fatalf("Format and Terbilang disagree for %d", n)
		}
		if fErr != nil {
			return
		}
		back, err := rupiah.Parse(formatted)
		if err != nil || back != a {
			t.Fatalf("round trip %d -> %q -> %d (%v)", n, formatted, back, err)
		}
	})
}
