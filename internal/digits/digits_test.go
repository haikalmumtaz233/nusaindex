package digits

import (
	"strings"
	"testing"
)

func TestCollect(t *testing.T) {
	tests := []struct {
		in     string
		want   string
		n      int
		status Status
	}{
		{"12 34-5.6", "123456", 6, OK},
		{"", "", 0, OK},
		{"12a", "12", 2, Charset},
		{"12 ", "12", 2, Charset},
		{strings.Repeat("1", MaxInput), strings.Repeat("1", 8), MaxInput, OK},
		{strings.Repeat("1", MaxInput+1), strings.Repeat("1", 8), MaxInput, TooLong},
	}
	for _, tt := range tests {
		var buf [8]byte
		n, status := Collect(buf[:], tt.in, " -.")
		if n != tt.n || status != tt.status {
			t.Errorf("Collect(%q) = %d, %d; want %d, %d", tt.in, n, status, tt.n, tt.status)
		}
		if got := string(buf[:min(n, len(buf))]); got != tt.want {
			t.Errorf("Collect(%q) digits = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestIntAndAllZero(t *testing.T) {
	if Int([]byte("0421")) != 421 {
		t.Error("Int")
	}
	if !AllZero([]byte("000")) || AllZero([]byte("010")) {
		t.Error("AllZero")
	}
}

func TestMask(t *testing.T) {
	tests := []struct {
		in   string
		keep int
		want string
	}{
		{"1234 5678", 4, "****5678"},
		{"1234", 4, "****"},
		{"12", 4, "**"},
		{"abc", 4, ""},
		{"+62 812-3456", 3, "******456"},
	}
	for _, tt := range tests {
		if got := Mask(tt.in, tt.keep); got != tt.want {
			t.Errorf("Mask(%q, %d) = %q, want %q", tt.in, tt.keep, got, tt.want)
		}
	}
	if Stars(3) != "***" {
		t.Error("Stars")
	}
}
