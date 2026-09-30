package npwp

import (
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
	"github.com/haikalmumtaz233/nusaindex/nik"
)

const (
	legacySize = 15
	size       = 16
	nitkuSize  = 22
	separators = " .-"
	maskKeep   = 4
)

var (
	ErrLength  error = errcode.New("npwp", "length")
	ErrCharset error = errcode.New("npwp", "charset")
	ErrNIK     error = errcode.New("npwp", "nik")
	ErrSerial  error = errcode.New("npwp", "serial")
)

type NPWP struct {
	NPWP16        string `json:"npwp16"`
	NPWP15        string `json:"npwp15,omitempty"`
	NITKU         string `json:"nitku,omitempty"`
	BusinessPlace string `json:"businessPlace,omitempty"`
	IsNIK         bool   `json:"isNik"`
	TaxOffice     string `json:"taxOffice,omitempty"`
	Status        string `json:"status,omitempty"`
}

type scanned struct {
	digits string
	base   string
}

func Valid(s string) bool {
	_, err := scan(s)
	return err == nil
}

func Parse(s string) (NPWP, error) {
	sc, err := scan(s)
	if err != nil {
		return NPWP{}, err
	}
	p := NPWP{NPWP16: sc.base, IsNIK: sc.base[0] != '0'}
	if !p.IsNIK {
		p.NPWP15 = sc.base[1:]
		p.TaxOffice = p.NPWP15[9:12]
		p.Status = p.NPWP15[12:15]
	}
	if len(sc.digits) == nitkuSize {
		p.NITKU = sc.digits
		p.BusinessPlace = sc.digits[size:]
	}
	return p, nil
}

func Format(s string) (string, error) {
	sc, err := scan(s)
	if err != nil {
		return "", err
	}
	if len(sc.digits) != legacySize {
		return sc.digits, nil
	}
	d := sc.digits
	return d[0:2] + "." + d[2:5] + "." + d[5:8] + "." + d[8:9] + "-" + d[9:12] + "." + d[12:15], nil
}

func To16(s string) (string, error) {
	sc, err := scan(s)
	if err != nil {
		return "", err
	}
	return sc.base, nil
}

func Mask(s string) string {
	return digits.Mask(s, maskKeep)
}

func scan(s string) (scanned, error) {
	var buf [nitkuSize]byte
	n, status := digits.Collect(buf[:], s, separators)
	if status == digits.Charset {
		return scanned{}, ErrCharset
	}
	if status == digits.TooLong || (n != legacySize && n != size && n != nitkuSize) {
		return scanned{}, ErrLength
	}
	d := string(buf[:n])
	base := "0" + d
	if n != legacySize {
		base = d[:size]
	}
	if base[0] != '0' {
		if !nik.Valid(base) {
			return scanned{}, ErrNIK
		}
		return scanned{digits: d, base: base}, nil
	}
	if digits.AllZero([]byte(base[1:10])) {
		return scanned{}, ErrSerial
	}
	return scanned{digits: d, base: base}, nil
}
