package region

import (
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	LevelProvince = "province"
	LevelRegency  = "regency"
	LevelDistrict = "district"
	LevelVillage  = "village"

	provinceSize = 2
	regencySize  = 5
	districtSize = 8
	villageSize  = 13
	codeDigits   = 10
	separators   = ". "
)

var (
	ErrLength  error = errcode.New("region", "length")
	ErrCharset error = errcode.New("region", "charset")
	ErrUnknown error = errcode.New("region", "unknown")
	ErrOptions error = errcode.New("region", "options")
)

type Region struct {
	Code       string `json:"code"`
	Name       string `json:"name"`
	Level      string `json:"level"`
	ParentCode string `json:"parentCode,omitempty"`
}

func Get(code string) (Region, error) {
	c, err := normalizeCode(code)
	if err != nil {
		return Region{}, err
	}
	d := load()
	i, ok := d.find(c)
	if !ok {
		return Region{}, ErrUnknown
	}
	return d.region(i), nil
}

func Children(code string) ([]Region, error) {
	d := load()
	if code == "" {
		out := make([]Region, 0, len(d.provinces))
		for _, i := range d.provinces {
			out = append(out, d.region(i))
		}
		return out, nil
	}
	c, err := normalizeCode(code)
	if err != nil {
		return nil, err
	}
	if _, ok := d.find(c); !ok {
		return nil, ErrUnknown
	}
	out := []Region{}
	size := childSize(len(c))
	for _, r := range d.descendants(c) {
		if len(r.code) == size {
			out = append(out, Region{Code: r.code, Name: r.name, Level: levelOf(r.code), ParentCode: c})
		}
	}
	return out, nil
}

func Resolve(code string) (Region, error) {
	c, err := normalizeCode(code)
	if err != nil {
		return Region{}, err
	}
	d := load()
	if i, ok := d.find(c); ok {
		return d.region(i), nil
	}
	current, ok := d.aliases[c]
	if !ok {
		return Region{}, ErrUnknown
	}
	i, _ := d.find(current)
	return d.region(i), nil
}

func normalizeCode(s string) (string, error) {
	var buf [codeDigits]byte
	n, status := digits.Collect(buf[:], s, separators)
	if status == digits.Charset {
		return "", ErrCharset
	}
	if status == digits.TooLong {
		return "", ErrLength
	}
	d := string(buf[:min(n, codeDigits)])
	switch n {
	case 2:
		return d, nil
	case 4:
		return d[0:2] + "." + d[2:4], nil
	case 6:
		return d[0:2] + "." + d[2:4] + "." + d[4:6], nil
	case codeDigits:
		return d[0:2] + "." + d[2:4] + "." + d[4:6] + "." + d[6:10], nil
	}
	return "", ErrLength
}

func levelOf(code string) string {
	switch len(code) {
	case provinceSize:
		return LevelProvince
	case regencySize:
		return LevelRegency
	case districtSize:
		return LevelDistrict
	}
	return LevelVillage
}

func childSize(size int) int {
	switch size {
	case provinceSize:
		return regencySize
	case regencySize:
		return districtSize
	case districtSize:
		return villageSize
	}
	return 0
}
