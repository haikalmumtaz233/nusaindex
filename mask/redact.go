package mask

import (
	"math"
	"reflect"
	"sort"
	"strconv"
)

const (
	MaxDepth = 32

	markerDepth    = "[MaxDepth]"
	markerCircular = "[Circular]"
	maxExactNumber = 1e21
)

var blockedKeys = map[string]bool{"__proto__": true, "constructor": true, "prototype": true}

type identity struct {
	ptr uintptr
	n   int
}

type walker struct {
	active map[identity]bool
	done   map[identity]any
}

func Redact(v any) any {
	w := walker{active: map[identity]bool{}, done: map[identity]any{}}
	return w.value(v, 0)
}

func (w *walker) value(v any, depth int) any {
	switch t := v.(type) {
	case string:
		return redactString(t)
	case float64:
		return redactFloat(t)
	case int:
		return redactInt(int64(t), v)
	case int64:
		return redactInt(t, v)
	case map[string]any:
		return w.container(identity{ptr: reflect.ValueOf(t).Pointer()}, depth, func() any { return w.object(t, depth) })
	case []any:
		if len(t) == 0 {
			return t
		}
		return w.container(identity{ptr: reflect.ValueOf(t).Pointer(), n: len(t)}, depth, func() any { return w.array(t, depth) })
	}
	return v
}

func (w *walker) container(id identity, depth int, build func() any) any {
	if w.active[id] {
		return markerCircular
	}
	if out, ok := w.done[id]; ok {
		return out
	}
	if depth >= MaxDepth {
		return markerDepth
	}
	w.active[id] = true
	out := build()
	delete(w.active, id)
	w.done[id] = out
	return out
}

func (w *walker) object(m map[string]any, depth int) any {
	keys := make([]string, 0, len(m))
	for k := range m {
		if !blockedKeys[k] {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)
	out := make(map[string]any, len(keys))
	for _, k := range keys {
		key := redactString(k)
		if blockedKeys[key] {
			continue
		}
		out[key] = w.value(m[k], depth+1)
	}
	return out
}

func (w *walker) array(a []any, depth int) any {
	out := make([]any, len(a))
	for i, item := range a {
		out[i] = w.value(item, depth+1)
	}
	return out
}

func redactFloat(f float64) any {
	if f != math.Trunc(f) || math.Abs(f) >= maxExactNumber {
		return f
	}
	s := strconv.FormatFloat(f, 'f', -1, 64)
	if out := redactString(s); out != s {
		return out
	}
	return f
}

func redactInt(n int64, original any) any {
	s := strconv.FormatInt(n, 10)
	if out := redactString(s); out != s {
		return out
	}
	return original
}
