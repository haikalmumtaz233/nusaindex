package csvx_test

import (
	"reflect"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
)

func collect(text string) [][]string {
	var rows [][]string
	csvx.Each(text, func(fields []string) {
		rows = append(rows, append([]string(nil), fields...))
	})
	return rows
}

func TestEach(t *testing.T) {
	cases := []struct {
		text string
		want [][]string
	}{
		{"a,b\n1,2\n3,4\n", [][]string{{"1", "2"}, {"3", "4"}}},
		{"a,b\n1,2", [][]string{{"1", "2"}}},
		{"a,b\n\"x,y\",\"say \"\"hi\"\"\"\n", [][]string{{"x,y", `say "hi"`}}},
		{"a\n\"end\"", [][]string{{"end"}}},
		{"a\n\"open", [][]string{{"open"}}},
		{"a,b\n\"q\",z\n", [][]string{{"q", "z"}}},
		{"a,b\n", nil},
		{"", nil},
	}
	for _, c := range cases {
		if got := collect(c.text); !reflect.DeepEqual(got, c.want) {
			t.Errorf("Each(%q) = %q, want %q", c.text, got, c.want)
		}
	}
}
