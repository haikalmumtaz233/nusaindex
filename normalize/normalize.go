package normalize

import "strings"

func Text(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		switch {
		case isZeroWidth(r):
		case isSpace(r):
			b.WriteByte(' ')
		case isDash(r):
			b.WriteByte('-')
		case r >= 0xFF01 && r <= 0xFF5E:
			b.WriteRune(r - 0xFEE0)
		case r >= 0x0660 && r <= 0x0669:
			b.WriteRune('0' + r - 0x0660)
		case r >= 0x06F0 && r <= 0x06F9:
			b.WriteRune('0' + r - 0x06F0)
		default:
			b.WriteRune(r)
		}
	}
	return strings.Trim(b.String(), " ")
}

func isZeroWidth(r rune) bool {
	switch r {
	case 0x00AD, 0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF:
		return true
	}
	return false
}

func isSpace(r rune) bool {
	switch r {
	case '\t', '\n', '\v', '\f', '\r', ' ', 0x0085, 0x00A0, 0x1680, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000:
		return true
	}
	return r >= 0x2000 && r <= 0x200A
}

func isDash(r rune) bool {
	switch r {
	case 0x2212, 0xFE58, 0xFE63:
		return true
	}
	return r >= 0x2010 && r <= 0x2015
}
