package region_test

import (
	"errors"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/region"
)

func searchOptions(args []any) region.SearchOptions {
	var o region.SearchOptions
	if len(args) < 2 {
		return o
	}
	m, _ := args[1].(map[string]any)
	o.Level, _ = m["level"].(string)
	o.Within, _ = m["within"].(string)
	if limit, ok := m["limit"].(float64); ok {
		o.Limit = int(limit)
	}
	return o
}

func TestVectors(t *testing.T) {
	vectortest.Run(t, "region", map[string]vectortest.Func{
		"get":      func(a []any) (any, error) { return region.Get(a[0].(string)) },
		"children": func(a []any) (any, error) { return region.Children(a[0].(string)) },
		"search":   func(a []any) (any, error) { return region.Search(a[0].(string), searchOptions(a)) },
		"resolve":  func(a []any) (any, error) { return region.Resolve(a[0].(string)) },
	})
}

func TestProvinces(t *testing.T) {
	provinces, err := region.Children("")
	if err != nil || len(provinces) != 38 {
		t.Fatalf("Children(\"\") = %d regions, %v; want 38", len(provinces), err)
	}
	if provinces[0].Code != "11" || provinces[37].Code != "96" {
		t.Fatalf("provinces not in code order: %v ... %v", provinces[0], provinces[37])
	}
}

func TestLevels(t *testing.T) {
	want := map[string]string{
		"11":            region.LevelProvince,
		"11.01":         region.LevelRegency,
		"11.01.01":      region.LevelDistrict,
		"11.01.01.2001": region.LevelVillage,
	}
	for code, level := range want {
		r, err := region.Get(code)
		if err != nil || r.Level != level {
			t.Errorf("Get(%q).Level = %q, %v; want %q", code, r.Level, err, level)
		}
	}
}

func TestSearchVillagesWithin(t *testing.T) {
	got, err := region.Search("keude", region.SearchOptions{Level: region.LevelVillage, Within: "11.01.01", Limit: 100})
	if err != nil || len(got) != 1 || got[0].Code != "11.01.01.2001" {
		t.Fatalf("Search within district = %v, %v", got, err)
	}
}

func TestSentinelErrors(t *testing.T) {
	if _, err := region.Get("99"); !errors.Is(err, region.ErrUnknown) {
		t.Fatalf("want ErrUnknown, got %v", err)
	}
	if _, err := region.Search("a", region.SearchOptions{Level: "city"}); !errors.Is(err, region.ErrOptions) {
		t.Fatalf("want ErrOptions, got %v", err)
	}
}

func FuzzGet(f *testing.F) {
	for _, s := range vectortest.Strings(f, "region") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		r, err := region.Get(s)
		if err != nil {
			return
		}
		again, err := region.Get(r.Code)
		if err != nil || again != r {
			t.Fatalf("Get(%q) = %v, but Get(%q) = %v, %v", s, r, r.Code, again, err)
		}
	})
}

func FuzzSearch(f *testing.F) {
	for _, s := range vectortest.Strings(f, "region") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		got, err := region.Search(s, region.SearchOptions{Level: region.LevelRegency})
		if err == nil && len(got) > 10 {
			t.Fatalf("Search(%q) returned %d results over the default limit", s, len(got))
		}
	})
}
