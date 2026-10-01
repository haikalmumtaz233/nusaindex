package rupiah

import (
	"strconv"
	"strings"

	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

type Amount int64

const (
	Sen    Amount = 1
	Rupiah Amount = 100

	MaxAmount    Amount = 999_999_999_999_999 * Rupiah
	MaxSenAmount Amount = 9_999_999_999_999*Rupiah + 99*Sen

	maxDigits     = 15
	decimalDigits = "0123456789"
	allowed       = decimalDigits + ".,- RrPpIiDd"
)

var (
	ErrLength  error = errcode.New("rupiah", "length")
	ErrCharset error = errcode.New("rupiah", "charset")
	ErrFormat  error = errcode.New("rupiah", "format")
	ErrRange   error = errcode.New("rupiah", "range")
)

type Options struct {
	Decimals   bool
	OmitSymbol bool
}

type parts struct {
	negative bool
	whole    int64
	sen      int64
}

func Format(a Amount, o Options) (string, error) {
	p, err := split(a)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	if p.negative {
		b.WriteByte('-')
	}
	if !o.OmitSymbol {
		b.WriteString("Rp")
	}
	writeGrouped(&b, p.whole)
	if p.sen != 0 || o.Decimals {
		b.WriteByte(',')
		b.WriteByte(decimalDigits[p.sen/10])
		b.WriteByte(decimalDigits[p.sen%10])
	}
	return b.String(), nil
}

func Valid(s string) bool {
	_, err := Parse(s)
	return err == nil
}

func Parse(s string) (Amount, error) {
	if len(s) > digits.MaxInput {
		return 0, ErrLength
	}
	for i := 0; i < len(s); i++ {
		if strings.IndexByte(allowed, s[i]) < 0 {
			return 0, ErrCharset
		}
	}
	sc := scanner{s: s}
	p, ok := sc.amount()
	if !ok {
		return 0, ErrFormat
	}
	if sc.overflow {
		return 0, ErrRange
	}
	a := Amount(p.whole)*Rupiah + Amount(p.sen)
	if p.sen != 0 && a > MaxSenAmount {
		return 0, ErrRange
	}
	if p.negative {
		a = -a
	}
	return a, nil
}

func Terbilang(a Amount) (string, error) {
	p, err := split(a)
	if err != nil {
		return "", err
	}
	var words []string
	if p.negative {
		words = append(words, "minus")
	}
	if p.whole > 0 || p.sen == 0 {
		words = appendNumber(words, p.whole)
		words = append(words, "rupiah")
	}
	if p.sen > 0 {
		words = appendNumber(words, p.sen)
		words = append(words, "sen")
	}
	return strings.Join(words, " "), nil
}

func split(a Amount) (parts, error) {
	if a > MaxAmount || a < -MaxAmount {
		return parts{}, ErrRange
	}
	p := parts{negative: a < 0}
	if p.negative {
		a = -a
	}
	p.whole = int64(a / Rupiah)
	p.sen = int64(a % Rupiah)
	if p.sen != 0 && a > MaxSenAmount {
		return parts{}, ErrRange
	}
	return p, nil
}

func writeGrouped(b *strings.Builder, n int64) {
	s := strconv.FormatInt(n, 10)
	lead := len(s) % 3
	if lead == 0 {
		lead = 3
	}
	b.WriteString(s[:lead])
	for i := lead; i < len(s); i += 3 {
		b.WriteByte('.')
		b.WriteString(s[i : i+3])
	}
}

var (
	units  = [...]string{"nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"}
	scales = [...]string{"", "ribu", "juta", "miliar", "triliun"}
)

func appendNumber(words []string, n int64) []string {
	if n == 0 {
		return append(words, units[0])
	}
	var groups [len(scales)]int64
	for i := range groups {
		groups[i] = n % 1000
		n /= 1000
	}
	for i := len(groups) - 1; i >= 0; i-- {
		g := groups[i]
		switch {
		case g == 0:
		case i == 1 && g == 1:
			words = append(words, "seribu")
		case i == 0:
			words = appendHundreds(words, g)
		default:
			words = append(appendHundreds(words, g), scales[i])
		}
	}
	return words
}

func appendHundreds(words []string, g int64) []string {
	h, r := g/100, g%100
	switch {
	case h == 1:
		words = append(words, "seratus")
	case h > 1:
		words = append(words, units[h], "ratus")
	}
	switch {
	case r == 0:
	case r < 10:
		words = append(words, units[r])
	case r == 10:
		words = append(words, "sepuluh")
	case r == 11:
		words = append(words, "sebelas")
	case r < 20:
		words = append(words, units[r-10], "belas")
	default:
		words = append(words, units[r/10], "puluh")
		if r%10 != 0 {
			words = append(words, units[r%10])
		}
	}
	return words
}
