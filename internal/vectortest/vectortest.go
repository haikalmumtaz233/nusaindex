package vectortest

import (
	"bytes"
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

type Func func(args []any) (any, error)

type file struct {
	Module string `json:"module"`
	Cases  []Case `json:"cases"`
}

type Case struct {
	Fn     string          `json:"fn"`
	Args   []any           `json:"args"`
	Output json.RawMessage `json:"output"`
	Error  string          `json:"error"`
}

func Load(tb testing.TB, module string) []Case {
	tb.Helper()
	raw, err := fs.ReadFile(os.DirFS(filepath.Join("..", "testdata", "vectors")), module+".json")
	if err != nil {
		tb.Fatalf("read vectors: %v", err)
	}
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	var f file
	if err := dec.Decode(&f); err != nil {
		tb.Fatalf("decode vectors: %v", err)
	}
	if f.Module != module {
		tb.Fatalf("vector module %q, want %q", f.Module, module)
	}
	return f.Cases
}

func Run(t *testing.T, module string, fns map[string]Func) {
	t.Helper()
	cases := Load(t, module)
	used := make(map[string]bool, len(fns))
	for i, c := range cases {
		fn, ok := fns[c.Fn]
		if !ok {
			t.Fatalf("case %d: no handler for fn %q", i, c.Fn)
		}
		used[c.Fn] = true
		got, err := fn(c.Args)
		check(t, i, c, got, err)
	}
	for name := range fns {
		if !used[name] {
			t.Errorf("fn %q has no vector", name)
		}
	}
}

func Strings(tb testing.TB, module string) []string {
	tb.Helper()
	var out []string
	for _, c := range Load(tb, module) {
		if len(c.Args) > 0 {
			if s, ok := c.Args[0].(string); ok {
				out = append(out, s)
			}
		}
	}
	return out
}

func check(t *testing.T, i int, c Case, got any, err error) {
	t.Helper()
	if c.Error != "" {
		if err == nil {
			t.Errorf("case %d %s%v: want error %q, got %v", i, c.Fn, c.Args, c.Error, got)
			return
		}
		if code := errcode.Of(err); code != c.Error {
			t.Errorf("case %d %s%v: want error %q, got %q", i, c.Fn, c.Args, c.Error, code)
		}
		return
	}
	if err != nil {
		t.Errorf("case %d %s%v: unexpected error %v", i, c.Fn, c.Args, err)
		return
	}
	gotJSON, mErr := json.Marshal(got)
	if mErr != nil {
		t.Fatalf("case %d: marshal: %v", i, mErr)
	}
	var want, have any
	if uErr := json.Unmarshal(c.Output, &want); uErr != nil {
		t.Fatalf("case %d: output: %v", i, uErr)
	}
	if uErr := json.Unmarshal(gotJSON, &have); uErr != nil {
		t.Fatalf("case %d: result: %v", i, uErr)
	}
	if !reflect.DeepEqual(want, have) {
		t.Errorf("case %d %s%v:\n want %s\n  got %s", i, c.Fn, c.Args, c.Output, gotJSON)
	}
}
