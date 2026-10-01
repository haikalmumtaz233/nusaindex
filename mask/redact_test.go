package mask_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/haikalmumtaz233/nusaindex/mask"
)

type contact struct {
	Phone string `json:"phone"`
}

type base struct {
	ID int64
}

type customer struct {
	base
	Name     string            `json:"name"`
	NIK      string            `json:"nik"`
	Hidden   string            `json:"-"`
	Contact  *contact          `json:"contact"`
	Aliases  []string          `json:"aliases"`
	Labels   map[string]string `json:"labels"`
	Account  uint64            `json:"account"`
	Code     shortCode         `json:"code"`
	Raw      []byte            `json:"raw"`
	Joined   time.Time         `json:"joined"`
	internal string
}

type shortCode string

type node struct {
	Next *node  `json:"next"`
	NIK  string `json:"nik"`
}

const fakePhone = "085952571710"

func fakeCustomer() customer {
	return customer{
		base:     base{ID: 3171014501909999},
		Name:     "Budi",
		NIK:      fakeNIK,
		Hidden:   fakeNIK,
		Contact:  &contact{Phone: fakePhone},
		Aliases:  []string{fakeNIK},
		Labels:   map[string]string{fakeNIK: fakeNIK},
		Account:  1234567890,
		Code:     shortCode(fakeNIK),
		Raw:      []byte(fakeNIK),
		Joined:   time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
		internal: fakeNIK,
	}
}

func encoded(t *testing.T, v any) string {
	t.Helper()
	out, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return string(out)
}

func TestRedactStruct(t *testing.T) {
	in := fakeCustomer()
	out, ok := mask.Redact(in).(map[string]any)
	if !ok {
		t.Fatalf("struct should become a map, got %T", mask.Redact(in))
	}
	text := encoded(t, out)
	for _, leak := range []string{fakeNIK, "1450190", "52571", "1234567890"} {
		if strings.Contains(text, leak) {
			t.Fatalf("redacted struct leaks %q: %s", leak, text)
		}
	}
	if out["name"] != "Budi" || out["ID"] != "************9999" || out["account"] != "******7890" {
		t.Fatalf("unexpected fields: %s", text)
	}
	if _, found := out["Hidden"]; found {
		t.Fatalf("json:\"-\" field copied: %s", text)
	}
	if _, found := out["internal"]; found {
		t.Fatalf("unexported field copied: %s", text)
	}
	if out["joined"] != in.Joined {
		t.Fatalf("time changed: %v", out["joined"])
	}
	if in.Contact.Phone != fakePhone || in.Aliases[0] != fakeNIK {
		t.Fatal("input was mutated")
	}
}

func TestRedactPointerCycle(t *testing.T) {
	n := &node{NIK: fakeNIK}
	n.Next = n
	out, ok := mask.Redact(n).(map[string]any)
	if !ok || out["next"] != "[Circular]" || out["nik"] != "************9999" {
		t.Fatalf("pointer cycle not handled: %v", out)
	}
	var none *node
	if mask.Redact(none) != nil {
		t.Fatal("nil pointer should stay nil")
	}
}

func TestRedactFailsClosed(t *testing.T) {
	for _, v := range []any{func() {}, make(chan int), complex(1, 2)} {
		if got := mask.Redact(v); got != mask.Redacted {
			t.Fatalf("Redact(%T) = %v, want %q", v, got, mask.Redacted)
		}
	}
	keys := map[int64]string{3171014501909999: "x"}
	if text := encoded(t, mask.Redact(keys)); strings.Contains(text, "1450190") {
		t.Fatalf("map key leaks: %s", text)
	}
	if got := mask.Redact([2]int32{7, 8}); encoded(t, got) != "[7,8]" {
		t.Fatalf("array = %v", got)
	}
	if got := mask.Redact(true); got != true {
		t.Fatalf("bool = %v", got)
	}
}

func TestHandlerRedactsNonStringValues(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(mask.NewHandler(slog.NewJSONHandler(&buf, nil)))
	logger.Info("signup",
		slog.Any("customer", fakeCustomer()),
		slog.Int64("nik", 3171014501909999),
		slog.Uint64("account", 1234567890),
		slog.Float64("float", 3171014501909999),
		slog.Int("small", 7),
		slog.Bool("ok", true),
	)
	text := buf.String()
	for _, leak := range []string{"1450190", "52571", "1234567890"} {
		if strings.Contains(text, leak) {
			t.Fatalf("log leaks %q: %s", leak, text)
		}
	}
	if !strings.Contains(text, `"small":7`) || !strings.Contains(text, `"ok":true`) {
		t.Fatalf("plain values changed: %s", text)
	}
}

type hiddenKinds struct {
	Flag    bool
	Any     any
	Nothing any
	Ptr     *contact
	NilPtr  *contact
	Map     map[int]string
	NilMap  map[string]string
	List    []uint16
	NilList []string
	Bytes   []byte
	Ratio   float32
	Small   uint8
	Big     uint64
	When    time.Time
	Arr     [1]string
	Fn      func()
}

type wrapper struct {
	hiddenKinds
	Proto string `json:"__proto__"`
}

type deep struct {
	Next any
}

func TestRedactEmbeddedKinds(t *testing.T) {
	in := wrapper{hiddenKinds: hiddenKinds{
		Flag:  true,
		Any:   fakeNIK,
		Ptr:   &contact{Phone: fakePhone},
		Map:   map[int]string{7: fakeNIK},
		List:  []uint16{7},
		Bytes: []byte(fakeNIK),
		Ratio: 1.5,
		Small: 7,
		Big:   3171014501909999,
		When:  time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
		Arr:   [1]string{fakeNIK},
	}, Proto: "x"}
	out := mask.Redact(in).(map[string]any)
	if _, found := out["__proto__"]; found {
		t.Fatalf("blocked key copied: %v", out)
	}
	text := encoded(t, map[string]any{"flag": out["Flag"], "rest": []any{out["Any"], out["Ptr"], out["Map"], out["List"], out["Bytes"], out["Big"], out["Arr"]}})
	if strings.Contains(text, "1450190") || strings.Contains(text, "52571") {
		t.Fatalf("read-only fields leak: %s", text)
	}
	if out["Flag"] != true || out["Small"] != uint8(7) || out["Ratio"] != float64(1.5) || out["When"] != in.When || out["Fn"] != mask.Redacted {
		t.Fatalf("unexpected read-only values: %v", out)
	}
	if out["Nothing"] != nil || out["NilPtr"] != nil || out["NilMap"] != nil || out["NilList"] != nil {
		t.Fatalf("nil values changed: %v", out)
	}
}

func TestRedactReflectedDepth(t *testing.T) {
	var cur any = "end"
	for range mask.MaxDepth + 5 {
		cur = deep{Next: [1]any{cur}}
	}
	text := encoded(t, mask.Redact(cur))
	if !strings.Contains(text, "[MaxDepth]") {
		t.Fatalf("depth not limited: %s", text)
	}
	blocked := map[string]int{"__proto__": 1, "ok": 2}
	if got := encoded(t, mask.Redact(blocked)); got != `{"ok":2}` {
		t.Fatalf("blocked map key copied: %s", got)
	}
	if got := mask.Redact(uint(7)); got != uint(7) {
		t.Fatalf("small uint changed: %v", got)
	}
}
