package plate

import (
	"strings"

	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	separators   = " -"
	maxGroups    = 3
	maxRegion    = 2
	maxNumber    = 4
	maxSuffix    = 3
	kindLetter   = 1
	kindDigit    = 2
	kindNone     = 0
	upperToLower = 'a' - 'A'
)

var (
	ErrLength  error = errcode.New("plate", "length")
	ErrCharset error = errcode.New("plate", "charset")
	ErrFormat  error = errcode.New("plate", "format")
)

type Plate struct {
	Region string `json:"region"`
	Number string `json:"number"`
	Suffix string `json:"suffix"`
}

type group struct {
	kind int
	text string
}

func Valid(s string) bool {
	_, err := Parse(s)
	return err == nil
}

func Parse(s string) (Plate, error) {
	groups, count, err := split(s)
	if err != nil {
		return Plate{}, err
	}
	if count < 2 || groups[0].kind != kindLetter || groups[1].kind != kindDigit {
		return Plate{}, ErrFormat
	}
	p := Plate{Region: groups[0].text, Number: groups[1].text}
	if count == maxGroups {
		if groups[2].kind != kindLetter || len(groups[2].text) > maxSuffix {
			return Plate{}, ErrFormat
		}
		p.Suffix = groups[2].text
	}
	if len(p.Region) > maxRegion || len(p.Number) > maxNumber || p.Number[0] == '0' {
		return Plate{}, ErrFormat
	}
	return p, nil
}

func Format(s string) (string, error) {
	p, err := Parse(s)
	if err != nil {
		return "", err
	}
	if p.Suffix == "" {
		return p.Region + " " + p.Number, nil
	}
	return p.Region + " " + p.Number + " " + p.Suffix, nil
}

func split(s string) ([maxGroups]group, int, error) {
	var groups [maxGroups]group
	var current strings.Builder
	currentKind := kindNone
	count := 0
	flush := func() bool {
		if currentKind == kindNone {
			return true
		}
		if count == maxGroups {
			return false
		}
		groups[count] = group{kind: currentKind, text: current.String()}
		count++
		current.Reset()
		currentKind = kindNone
		return true
	}
	for i := 0; i < len(s); i++ {
		if i == digits.MaxInput {
			return groups, 0, ErrLength
		}
		c := s[i]
		kind := classify(c)
		if kind == kindNone {
			if strings.IndexByte(separators, c) < 0 {
				return groups, 0, ErrCharset
			}
			if !flush() {
				return groups, 0, ErrFormat
			}
			continue
		}
		if kind != currentKind && !flush() {
			return groups, 0, ErrFormat
		}
		if c >= 'a' && c <= 'z' {
			c -= upperToLower
		}
		current.WriteByte(c)
		currentKind = kind
	}
	if !flush() {
		return groups, 0, ErrFormat
	}
	if count == 0 {
		return groups, 0, ErrLength
	}
	return groups, count, nil
}

func classify(c byte) int {
	switch {
	case c >= '0' && c <= '9':
		return kindDigit
	case (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'):
		return kindLetter
	}
	return kindNone
}
