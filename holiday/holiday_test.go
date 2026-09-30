package holiday_test

import (
	"errors"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/holiday"
	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "holiday", map[string]vectortest.Func{
		"years":   func([]any) (any, error) { return holiday.Years(), nil },
		"inYear":  func(a []any) (any, error) { return holiday.InYear(int(a[0].(float64))) },
		"between": func(a []any) (any, error) { return holiday.Between(a[0].(string), a[1].(string)) },
		"on":      func(a []any) (any, error) { return holiday.On(a[0].(string)) },
	})
}

func TestEveryYearHasNationalHolidays(t *testing.T) {
	c := holiday.Years()
	for year := c.From; year <= c.To; year++ {
		list, err := holiday.InYear(year)
		if err != nil || len(list) < 15 {
			t.Fatalf("InYear(%d) = %d holidays, %v", year, len(list), err)
		}
	}
}

func TestSentinelErrors(t *testing.T) {
	if _, err := holiday.On("2025-02-30"); !errors.Is(err, holiday.ErrDate) {
		t.Fatalf("want ErrDate, got %v", err)
	}
	if _, err := holiday.InYear(1999); !errors.Is(err, holiday.ErrRange) {
		t.Fatalf("want ErrRange, got %v", err)
	}
}

func FuzzOn(f *testing.F) {
	for _, s := range vectortest.Strings(f, "holiday") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		list, err := holiday.On(s)
		for _, h := range list {
			if h.Date != s {
				t.Fatalf("On(%q) returned %q", s, h.Date)
			}
		}
		_ = err
	})
}
