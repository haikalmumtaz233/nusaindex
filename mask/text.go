package mask

import "strings"

const minDigits = 10

func Text(s string) (string, error) {
	if len(s) > MaxText {
		return "", ErrLength
	}
	var b strings.Builder
	b.Grow(len(s))
	for i := 0; i < len(s); {
		if !tokenStart(s, i) {
			b.WriteByte(s[i])
			i++
			continue
		}
		end, last := tokenEnd(s, i)
		switch {
		case i > 0 && isLetter(s[i-1]):
			end = firstRunEnd(s, i)
			b.WriteString(s[i:end])
		case end < len(s) && isLetter(s[end]) && last > i+1:
			end = last - 1
			b.WriteString(maskToken(s[i:end]))
		case end < len(s) && isLetter(s[end]):
			b.WriteString(s[i:end])
		default:
			b.WriteString(maskToken(s[i:end]))
		}
		i = end
	}
	return b.String(), nil
}

func redactString(s string) string {
	out, err := Text(s)
	if err != nil {
		return Redacted
	}
	return out
}

func tokenStart(s string, i int) bool {
	return isDigit(s[i]) || (s[i] == '+' && i+1 < len(s) && isDigit(s[i+1]))
}

func tokenEnd(s string, i int) (end, last int) {
	if s[i] == '+' {
		i++
	}
	for {
		last = i
		run := runLength(s, i)
		i += run
		if i+1 >= len(s) || !isDigit(s[i+1]) {
			return i, last
		}
		switch s[i] {
		case '.', '-':
		case ' ':
			if run < 3 && runLength(s, i+1) < 3 {
				return i, last
			}
		default:
			return i, last
		}
		i++
	}
}

func firstRunEnd(s string, i int) int {
	if s[i] == '+' {
		i++
	}
	return i + runLength(s, i)
}

func runLength(s string, i int) int {
	n := 0
	for i+n < len(s) && isDigit(s[i+n]) {
		n++
	}
	return n
}

func maskToken(token string) string {
	var buf [minDigits]byte
	n := 0
	for i := 0; i < len(token); i++ {
		if isDigit(token[i]) {
			if n < len(buf) {
				buf[n] = token[i]
			}
			n++
		}
	}
	switch {
	case n < minDigits:
		return token
	case phoneLike(token[0] == '+', string(buf[:3])):
		return Phone(token)
	default:
		return NIK(token)
	}
}

func phoneLike(plus bool, lead string) bool {
	if plus {
		return lead == "628"
	}
	return lead == "628" || lead[:2] == "08"
}

func isDigit(c byte) bool {
	return c >= '0' && c <= '9'
}

func isLetter(c byte) bool {
	c |= 0x20
	return c >= 'a' && c <= 'z'
}
