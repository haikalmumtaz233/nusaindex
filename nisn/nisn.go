package nisn

import (
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	Size       = 10
	separators = " .-"
	maskKeep   = 4
)

var (
	ErrLength  error = errcode.New("nisn", "length")
	ErrCharset error = errcode.New("nisn", "charset")
	ErrSerial  error = errcode.New("nisn", "serial")
)

type NISN struct {
	Number string `json:"nisn"`
}

func Valid(s string) bool {
	var buf [Size]byte
	return scan(buf[:], s) == nil
}

func Parse(s string) (NISN, error) {
	var buf [Size]byte
	if err := scan(buf[:], s); err != nil {
		return NISN{}, err
	}
	return NISN{Number: string(buf[:])}, nil
}

func Format(s string) (string, error) {
	p, err := Parse(s)
	return p.Number, err
}

func Mask(s string) string {
	return digits.Mask(s, maskKeep)
}

func scan(d []byte, s string) error {
	n, status := digits.Collect(d, s, separators)
	if status == digits.Charset {
		return ErrCharset
	}
	if status == digits.TooLong || n != Size {
		return ErrLength
	}
	if digits.AllZero(d) {
		return ErrSerial
	}
	return nil
}
