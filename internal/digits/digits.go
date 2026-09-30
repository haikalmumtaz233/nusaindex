package digits

import "strings"

const MaxInput = 64

type Status uint8

const (
	OK Status = iota
	Charset
	TooLong
)

func Collect(dst []byte, s, separators string) (int, Status) {
	n := 0
	for i := 0; i < len(s); i++ {
		if i == MaxInput {
			return n, TooLong
		}
		c := s[i]
		if c >= '0' && c <= '9' {
			if n < len(dst) {
				dst[n] = c
			}
			n++
			continue
		}
		if strings.IndexByte(separators, c) < 0 {
			return n, Charset
		}
	}
	return n, OK
}

func Int(b []byte) int {
	v := 0
	for _, c := range b {
		v = v*10 + int(c-'0')
	}
	return v
}

func AllZero(b []byte) bool {
	for _, c := range b {
		if c != '0' {
			return false
		}
	}
	return true
}

func Mask(s string, keep int) string {
	count := 0
	for i := 0; i < len(s); i++ {
		if s[i] >= '0' && s[i] <= '9' {
			count++
		}
	}
	hidden := count - keep
	if hidden <= 0 {
		hidden = count
	}
	var b strings.Builder
	b.Grow(count)
	seen := 0
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			continue
		}
		if seen < hidden {
			b.WriteByte('*')
		} else {
			b.WriteByte(c)
		}
		seen++
	}
	return b.String()
}

func Stars(n int) string {
	return strings.Repeat("*", n)
}
