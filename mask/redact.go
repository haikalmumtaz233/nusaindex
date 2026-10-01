package mask

import (
	"fmt"
	"math"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	MaxDepth = 32

	markerDepth    = "[MaxDepth]"
	markerCircular = "[Circular]"
	maxExactNumber = 1e21
)

var blockedKeys = map[string]bool{"__proto__": true, "constructor": true, "prototype": true}

var timeType = reflect.TypeFor[time.Time]()

type identity struct {
	ptr uintptr
	n   int
	typ reflect.Type
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
	case nil:
		return nil
	case string:
		return redactString(t)
	case float64:
		return redactFloat(t)
	case int:
		return redactInt(int64(t), v)
	case int64:
		return redactInt(t, v)
	case bool, time.Time, time.Duration:
		return v
	case map[string]any:
		return w.container(identity{ptr: reflect.ValueOf(t).Pointer()}, depth, func() any { return w.object(t, depth) })
	case []any:
		if len(t) == 0 {
			return t
		}
		return w.container(identity{ptr: reflect.ValueOf(t).Pointer(), n: len(t)}, depth, func() any { return w.array(t, depth) })
	}
	return w.reflected(reflect.ValueOf(v), depth)
}

func (w *walker) reflected(rv reflect.Value, depth int) any {
	switch rv.Kind() {
	case reflect.Bool:
		return plain(rv, rv.Bool())
	case reflect.String:
		return redactString(rv.String())
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return redactInt(rv.Int(), plain(rv, rv.Int()))
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return redactUint(rv.Uint(), plain(rv, rv.Uint()))
	case reflect.Float32, reflect.Float64:
		return redactFloat(rv.Float())
	case reflect.Pointer:
		if rv.IsNil() {
			return nil
		}
		return w.container(identity{ptr: rv.Pointer(), typ: rv.Type()}, depth, func() any { return w.nested(rv.Elem(), depth) })
	case reflect.Interface:
		if rv.IsNil() {
			return nil
		}
		return w.nested(rv.Elem(), depth)
	case reflect.Struct:
		if rv.Type() == timeType {
			return plain(rv, Redacted)
		}
		if depth >= MaxDepth {
			return markerDepth
		}
		return w.structFields(rv, depth)
	case reflect.Map:
		if rv.IsNil() {
			return nil
		}
		return w.container(identity{ptr: rv.Pointer(), typ: rv.Type()}, depth, func() any { return w.mapEntries(rv, depth) })
	case reflect.Slice:
		if rv.IsNil() {
			return nil
		}
		if rv.Type().Elem().Kind() == reflect.Uint8 {
			return redactString(string(rv.Bytes()))
		}
		return w.container(identity{ptr: rv.Pointer(), n: rv.Len(), typ: rv.Type()}, depth, func() any { return w.elements(rv, depth) })
	case reflect.Array:
		if depth >= MaxDepth {
			return markerDepth
		}
		return w.elements(rv, depth)
	default:
		return Redacted
	}
}

func (w *walker) nested(rv reflect.Value, depth int) any {
	if rv.CanInterface() {
		return w.value(rv.Interface(), depth)
	}
	return w.reflected(rv, depth)
}

func plain(rv reflect.Value, fallback any) any {
	if rv.CanInterface() {
		return rv.Interface()
	}
	return fallback
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

func (w *walker) elements(rv reflect.Value, depth int) any {
	out := make([]any, rv.Len())
	for i := range out {
		out[i] = w.nested(rv.Index(i), depth+1)
	}
	return out
}

func (w *walker) mapEntries(rv reflect.Value, depth int) any {
	out := make(map[string]any, rv.Len())
	iter := rv.MapRange()
	for iter.Next() {
		key := redactString(mapKey(iter.Key()))
		if blockedKeys[key] {
			continue
		}
		out[key] = w.nested(iter.Value(), depth+1)
	}
	return out
}

func mapKey(k reflect.Value) string {
	if k.Kind() == reflect.String {
		return k.String()
	}
	if !k.CanInterface() {
		return Redacted
	}
	return fmt.Sprint(k.Interface())
}

func (w *walker) structFields(rv reflect.Value, depth int) map[string]any {
	out := map[string]any{}
	t := rv.Type()
	for i := range t.NumField() {
		field := t.Field(i)
		name, skip := fieldName(field)
		if skip {
			continue
		}
		value := rv.Field(i)
		if field.Anonymous && name == "" && value.Kind() == reflect.Struct {
			for k, v := range w.structFields(value, depth) {
				if _, taken := out[k]; !taken {
					out[k] = v
				}
			}
			continue
		}
		if name == "" {
			name = field.Name
		}
		key := redactString(name)
		if blockedKeys[key] {
			continue
		}
		out[key] = w.nested(value, depth+1)
	}
	return out
}

func fieldName(field reflect.StructField) (string, bool) {
	if !field.IsExported() && !field.Anonymous {
		return "", true
	}
	tag := field.Tag.Get("json")
	if tag == "-" {
		return "", true
	}
	name, _, _ := strings.Cut(tag, ",")
	if !field.IsExported() && (name != "" || field.Type.Kind() != reflect.Struct) {
		return "", true
	}
	return name, false
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

func redactUint(n uint64, original any) any {
	s := strconv.FormatUint(n, 10)
	if out := redactString(s); out != s {
		return out
	}
	return original
}
