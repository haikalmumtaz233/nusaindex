package region

import (
	"sync"

	"github.com/haikalmumtaz233/nusaindex/data"
	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
)

const (
	maxPlateCode   = 2
	maxAreaCode    = 4
	areaSeparators = " -()"
)

var plates = sync.OnceValue(func() map[string][]string {
	return group(data.PlateCodes())
})

var areas = sync.OnceValue(func() map[string][]string {
	return group(data.AreaCodes())
})

func group(text string) map[string][]string {
	out := make(map[string][]string)
	csvx.Each(text, func(f []string) {
		out[f[0]] = append(out[f[0]], f[1])
	})
	return out
}

func ByPlate(code string) ([]Region, error) {
	c, err := plateCode(code)
	if err != nil {
		return nil, err
	}
	return regionsOf(plates()[c])
}

func plateCode(s string) (string, error) {
	b := make([]byte, 0, maxPlateCode)
	for i := 0; i < len(s); i++ {
		if i == digits.MaxInput {
			return "", ErrLength
		}
		c := s[i]
		switch {
		case c == ' ':
			continue
		case c >= 'a' && c <= 'z':
			c -= 'a' - 'A'
		case c < 'A' || c > 'Z':
			return "", ErrCharset
		}
		if len(b) == maxPlateCode {
			return "", ErrLength
		}
		b = append(b, c)
	}
	if len(b) == 0 {
		return "", ErrLength
	}
	return string(b), nil
}

func regionsOf(codes []string) ([]Region, error) {
	if len(codes) == 0 {
		return nil, ErrUnknown
	}
	d := load()
	out := make([]Region, 0, len(codes))
	for _, code := range codes {
		i, _ := d.find(code)
		out = append(out, d.region(i))
	}
	return out, nil
}

func ByAreaCode(code string) ([]Region, error) {
	c, err := areaCode(code)
	if err != nil {
		return nil, err
	}
	return regionsOf(areas()[c])
}

func areaCode(s string) (string, error) {
	var buf [maxAreaCode]byte
	n, status := digits.Collect(buf[:], s, areaSeparators)
	if status == digits.Charset {
		return "", ErrCharset
	}
	if status == digits.TooLong || n == 0 || n > maxAreaCode {
		return "", ErrLength
	}
	c := string(buf[:n])
	if c[0] != '0' {
		c = "0" + c
	}
	if len(c) < 3 || len(c) > maxAreaCode {
		return "", ErrLength
	}
	return c, nil
}
