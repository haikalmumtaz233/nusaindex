package normalize_test

import (
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/normalize"
)

func TestVectors(t *testing.T) {
	vectortest.Run(t, "normalize", map[string]vectortest.Func{
		"text": func(a []any) (any, error) { return normalize.Text(a[0].(string)), nil },
	})
}

func FuzzText(f *testing.F) {
	for _, s := range vectortest.Strings(f, "normalize") {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, s string) {
		once := normalize.Text(s)
		if twice := normalize.Text(once); twice != once {
			t.Fatalf("not idempotent: %q -> %q -> %q", s, once, twice)
		}
		if strings.ContainsRune(once, 0x200B) || strings.ContainsRune(once, 0xFEFF) {
			t.Fatalf("zero-width kept: %q", once)
		}
	})
}
