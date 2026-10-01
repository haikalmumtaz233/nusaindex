package mask

import (
	"reflect"
	"testing"
	"time"
)

type sealed struct {
	flag  bool
	small int8
	big   uint64
	when  time.Time
	key   map[sealedKey]string
}

type sealedKey struct{ n int }

func TestReadOnlyValuesNeverPanic(t *testing.T) {
	in := sealed{flag: true, small: 7, big: 3171014501909999, when: time.Unix(0, 0), key: map[sealedKey]string{{n: 1}: "x"}}
	rv := reflect.ValueOf(in)
	w := walker{active: map[identity]bool{}, done: map[identity]any{}}
	got := []any{
		w.nested(rv.Field(0), 0),
		w.nested(rv.Field(1), 0),
		w.nested(rv.Field(2), 0),
		w.nested(rv.Field(3), 0),
	}
	want := []any{true, int64(7), "************9999", Redacted}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("field %d = %v, want %v", i, got[i], want[i])
		}
	}
	keys, ok := w.nested(rv.Field(4), 0).(map[string]any)
	if !ok || keys[Redacted] != "x" {
		t.Fatalf("read-only map key = %v", keys)
	}
}
