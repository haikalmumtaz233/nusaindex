package phone

import (
	"strings"

	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	TypeMobile = "mobile"
	TypeFixed  = "fixed"

	countryCode  = "62"
	separators   = " -.()"
	maxDigits    = 15
	maskKeep     = 3
	minMobileNSN = 9
	maxMobileNSN = 12
	minFixedNSN  = 8
	maxFixedNSN  = 11
)

const (
	operatorTelkomsel = "Telkomsel"
	operatorIOH       = "Indosat Ooredoo Hutchison"
	operatorXLSmart   = "XLSmart"
)

var (
	ErrLength  error = errcode.New("phone", "length")
	ErrCharset error = errcode.New("phone", "charset")
	ErrCountry error = errcode.New("phone", "country")
	ErrPrefix  error = errcode.New("phone", "prefix")
)

type Phone struct {
	E164     string `json:"e164"`
	National string `json:"national"`
	Type     string `json:"type"`
	Prefix   string `json:"prefix,omitempty"`
	Brand    string `json:"brand,omitempty"`
	Operator string `json:"operator,omitempty"`
	AreaCode string `json:"areaCode,omitempty"`
}

func Valid(s string) bool {
	_, err := Parse(s)
	return err == nil
}

func Parse(s string) (Phone, error) {
	nsn, err := subscriberNumber(s)
	if err != nil {
		return Phone{}, err
	}
	p := Phone{E164: "+" + countryCode + nsn, National: "0" + nsn}
	if nsn[0] == '8' {
		brand, operator := mobileBrand(nsn[:3])
		if brand == "" {
			return Phone{}, ErrPrefix
		}
		if len(nsn) < minMobileNSN || len(nsn) > maxMobileNSN {
			return Phone{}, ErrLength
		}
		p.Type = TypeMobile
		p.Prefix = "0" + nsn[:3]
		p.Brand = brand
		p.Operator = operator
		return p, nil
	}
	if !isFixedLead(nsn[0]) {
		return Phone{}, ErrPrefix
	}
	if len(nsn) < minFixedNSN || len(nsn) > maxFixedNSN {
		return Phone{}, ErrLength
	}
	p.Type = TypeFixed
	p.AreaCode = "0" + nsn[:areaCodeLength(nsn)]
	return p, nil
}

func Format(s string) (string, error) {
	p, err := Parse(s)
	if err != nil {
		return "", err
	}
	return p.E164, nil
}

func WhatsAppLink(s string) (string, error) {
	p, err := Parse(s)
	if err != nil {
		return "", err
	}
	return "https://wa.me/" + p.E164[1:], nil
}

func Mask(s string) string {
	p, err := Parse(s)
	if err != nil {
		return digits.Mask(s, maskKeep)
	}
	nsn := p.E164[len(countryCode)+1:]
	return "+" + countryCode + digits.Stars(len(nsn)-maskKeep) + nsn[len(nsn)-maskKeep:]
}

func subscriberNumber(s string) (string, error) {
	var buf [maxDigits]byte
	n, plus, err := collect(buf[:], s)
	if err != nil {
		return "", err
	}
	if n == 0 || n > maxDigits {
		return "", ErrLength
	}
	d := string(buf[:n])
	var nsn string
	switch {
	case strings.HasPrefix(d, countryCode):
		nsn = strings.TrimPrefix(d[len(countryCode):], "0")
	case plus:
		return "", ErrCountry
	case d[0] == '0':
		nsn = d[1:]
	case d[0] == '8':
		nsn = d
	default:
		return "", ErrPrefix
	}
	if len(nsn) < 3 {
		return "", ErrLength
	}
	return nsn, nil
}

func collect(dst []byte, s string) (int, bool, error) {
	n := 0
	plus := false
	for i := 0; i < len(s); i++ {
		if i == digits.MaxInput {
			return n, plus, ErrLength
		}
		c := s[i]
		switch {
		case c >= '0' && c <= '9':
			if n < len(dst) {
				dst[n] = c
			}
			n++
		case c == '+' && n == 0 && !plus:
			plus = true
		case strings.IndexByte(separators, c) >= 0:
		default:
			return n, plus, ErrCharset
		}
	}
	return n, plus, nil
}

func mobileBrand(prefix string) (brand, operator string) {
	switch prefix {
	case "811", "812", "813", "821", "822", "823", "851", "852", "853":
		return "Telkomsel", operatorTelkomsel
	case "814", "815", "816", "855", "856", "857", "858":
		return "IM3", operatorIOH
	case "895", "896", "897", "898", "899":
		return "Tri", operatorIOH
	case "817", "818", "819", "859", "877", "878":
		return "XL", operatorXLSmart
	case "831", "832", "833", "838":
		return "AXIS", operatorXLSmart
	case "881", "882", "883", "884", "885", "886", "887", "888", "889":
		return "Smartfren", operatorXLSmart
	}
	return "", ""
}

func isFixedLead(c byte) bool {
	return (c >= '2' && c <= '7') || c == '9'
}

func areaCodeLength(nsn string) int {
	switch nsn[:2] {
	case "21", "22", "24", "31", "61":
		return 2
	}
	return 3
}
