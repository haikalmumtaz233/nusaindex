package mask_test

import (
	"bytes"
	"context"
	"log/slog"
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/mask"
)

type valuer struct{}

func (valuer) LogValue() slog.Value { return slog.StringValue("nik " + fakeNIK) }

func TestHandler(t *testing.T) {
	var buf bytes.Buffer
	base := slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo})
	h := mask.NewHandler(base)
	if h.Enabled(context.Background(), slog.LevelDebug) {
		t.Fatal("debug should be disabled")
	}
	logger := slog.New(h).With("hp", "0812-0000-0001").WithGroup("user")
	logger.Info("login "+fakeNIK,
		"nik", fakeNIK,
		"lazy", valuer{},
		"count", 12345678901234,
		slog.Group("doc", "npwp", "01.234.567.8-901.000"),
	)
	out := buf.String()
	for _, leak := range []string{fakeNIK, "0812-0000-0001", "567.8-901"} {
		if strings.Contains(out, leak) {
			t.Fatalf("log leaks %q: %s", leak, out)
		}
	}
	for _, want := range []string{`"msg":"login ************9999"`, `"hp":"+62********001"`, `"lazy":"nik ************9999"`, `"npwp":"***********1000"`, `"count":"**********1234"`} {
		if !strings.Contains(out, want) {
			t.Fatalf("log missing %s: %s", want, out)
		}
	}
}

func TestHandlerGroupDepth(t *testing.T) {
	var buf bytes.Buffer
	attr := slog.String("nik", fakeNIK)
	for range mask.MaxDepth + 2 {
		attr = slog.Group("g", attr)
	}
	slog.New(mask.NewHandler(slog.NewJSONHandler(&buf, nil))).Info("deep", attr)
	if strings.Contains(buf.String(), fakeNIK) || !strings.Contains(buf.String(), "[MaxDepth]") {
		t.Fatalf("deep group not cut: %s", buf.String())
	}
}
