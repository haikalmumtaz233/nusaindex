package dates

import "testing"

func TestValid(t *testing.T) {
	tests := []struct {
		y, m, d int
		want    bool
	}{
		{2024, 2, 29, true},
		{2023, 2, 29, false},
		{1900, 2, 29, false},
		{2000, 2, 29, true},
		{2025, 4, 31, false},
		{2025, 12, 31, true},
		{2025, 13, 1, false},
		{2025, 0, 1, false},
		{2025, 1, 0, false},
		{0, 1, 1, false},
		{10000, 1, 1, false},
	}
	for _, tt := range tests {
		if got := Valid(tt.y, tt.m, tt.d); got != tt.want {
			t.Errorf("Valid(%d, %d, %d) = %v", tt.y, tt.m, tt.d, got)
		}
	}
}

func TestISO(t *testing.T) {
	if got := ISODate(987, 3, 7); got != "0987-03-07" {
		t.Errorf("ISODate = %q", got)
	}
	if got := ISOMonth(2024, 11); got != "2024-11" {
		t.Errorf("ISOMonth = %q", got)
	}
}

func TestParseISO(t *testing.T) {
	tests := []struct {
		s  string
		ok bool
	}{
		{"2024-02-29", true},
		{"2023-02-29", false},
		{"2024-2-29", false},
		{"2024/02/29", false},
		{"2024-0a-29", false},
		{"", false},
	}
	for _, tt := range tests {
		y, m, d, ok := ParseISO(tt.s)
		if ok != tt.ok || (ok && ISODate(y, m, d) != tt.s) {
			t.Errorf("ParseISO(%q) = %d-%d-%d, %v", tt.s, y, m, d, ok)
		}
	}
}
