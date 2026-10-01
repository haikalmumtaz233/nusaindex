package mask

import (
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
	"github.com/haikalmumtaz233/nusaindex/phone"
)

const (
	MaxText  = 1 << 20
	Redacted = "[redacted]"

	keep = 4
)

var ErrLength error = errcode.New("mask", "length")

func NIK(s string) string {
	return digits.Mask(s, keep)
}

func NPWP(s string) string {
	return digits.Mask(s, keep)
}

func Phone(s string) string {
	return phone.Mask(s)
}

func NIP(s string) string {
	return digits.Mask(s, keep)
}

func NISN(s string) string {
	return digits.Mask(s, keep)
}

func Account(s string) string {
	return digits.Mask(s, keep)
}
