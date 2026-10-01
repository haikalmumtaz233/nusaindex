package mask_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/mask"
)

const fakeNIK = "3171014501909999"

func str(f func(string) string) vectortest.Func {
	return func(a []any) (any, error) { return f(a[0].(string)), nil }
}

func TestVectors(t *testing.T) {
	vectortest.Run(t, "mask", map[string]vectortest.Func{
		"nik":     str(mask.NIK),
		"npwp":    str(mask.NPWP),
		"phone":   str(mask.Phone),
		"nip":     str(mask.NIP),
		"nisn":    str(mask.NISN),
		"account": str(mask.Account),
		"text":    func(a []any) (any, error) { return mask.Text(a[0].(string)) },
		"redact":  func(a []any) (any, error) { return mask.Redact(a[0]), nil },
	})
}

func TestTextLimit(t *testing.T) {
	long := strings.Repeat("a", mask.MaxText+1)
	if _, err := mask.Text(long); !errors.Is(err, mask.ErrLength) {
		t.Fatalf("want ErrLength, got %v", err)
	}
	if got := mask.Redact(long); got != mask.Redacted {
		t.Fatalf("Redact of oversized string = %v", got)
	}
}

func nested(levels int) map[string]any {
	root := map[string]any{}
	cur := root
	for range levels {
		next := map[string]any{}
		cur["child"] = next
		cur = next
	}
	return root
}

func TestRedactDepth(t *testing.T) {
	cur, ok := mask.Redact(nested(40)).(map[string]any)
	for depth := range mask.MaxDepth - 1 {
		if !ok {
			t.Fatalf("depth %d is not an object", depth)
		}
		cur, ok = cur["child"].(map[string]any)
	}
	if !ok || cur["child"] != "[MaxDepth]" {
		t.Fatalf("want [MaxDepth] at depth %d, got %v", mask.MaxDepth, cur["child"])
	}
}

func TestRedactCycles(t *testing.T) {
	m := map[string]any{"nik": fakeNIK}
	m["self"] = m
	list := []any{fakeNIK, nil}
	list[1] = list
	shared := map[string]any{"n": int64(3171014501909999)}
	out := mask.Redact(map[string]any{"m": m, "list": list, "a": shared, "b": shared, "i": 3171014501909999, "small": 7}).(map[string]any)
	inner := out["m"].(map[string]any)
	if inner["self"] != "[Circular]" || inner["nik"] != "************9999" {
		t.Fatalf("cycle not handled: %v", inner)
	}
	if out["list"].([]any)[1] != "[Circular]" {
		t.Fatalf("slice cycle not handled: %v", out["list"])
	}
	if out["a"].(map[string]any)["n"] != "************9999" || out["i"] != "************9999" || out["small"] != 7 {
		t.Fatalf("numbers not redacted: %v", out)
	}
	if m["nik"] != fakeNIK {
		t.Fatal("input was mutated")
	}
}

func FuzzText(f *testing.F) {
	for _, s := range vectortest.Strings(f, "mask") {
		f.Add(s, "")
	}
	f.Add("ab1", "1a")
	f.Add("08", "12 b")
	f.Fuzz(func(t *testing.T, prefix, suffix string) {
		out, err := mask.Text(prefix + " " + fakeNIK + " " + suffix)
		if err != nil {
			t.Fatal(err)
		}
		const middle = "1450190"
		if strings.Contains(out, middle) && !strings.Contains(prefix+suffix, middle) {
			t.Fatalf("text leaks nik: %q %q -> %q", prefix, suffix, out)
		}
		if _, err := mask.Text(out); err != nil {
			t.Fatal(err)
		}
	})
}
