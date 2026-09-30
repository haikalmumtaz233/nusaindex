package bank

import (
	"sync"

	"github.com/haikalmumtaz233/nusaindex/data"
	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	codeSize     = 3
	bicSize      = 8
	bicLongSize  = 11
	codeSpaces   = " "
	lowerToUpper = 'a' - 'A'
)

var (
	ErrLength  error = errcode.New("bank", "length")
	ErrCharset error = errcode.New("bank", "charset")
	ErrUnknown error = errcode.New("bank", "unknown")
)

type Bank struct {
	Code       string `json:"code"`
	BIC        string `json:"bic"`
	OfficeCode string `json:"officeCode"`
	Name       string `json:"name"`
	ShortName  string `json:"shortName"`
	ShariaUnit bool   `json:"shariaUnit"`
}

var load = sync.OnceValue(func() []Bank {
	out := make([]Bank, 0, 128)
	csvx.Each(data.Banks(), func(f []string) {
		out = append(out, Bank{Code: f[0], ShariaUnit: f[1] == "1", BIC: f[2], OfficeCode: f[3], Name: f[4], ShortName: f[5]})
	})
	return out
})

func List() []Bank {
	return append([]Bank{}, load()...)
}

func ByCode(code string) ([]Bank, error) {
	var buf [codeSize]byte
	n, status := digits.Collect(buf[:], code, codeSpaces)
	if status == digits.Charset {
		return nil, ErrCharset
	}
	if status == digits.TooLong || n != codeSize {
		return nil, ErrLength
	}
	c := string(buf[:])
	var out []Bank
	for _, b := range load() {
		if b.Code == c {
			out = append(out, b)
		}
	}
	if out == nil {
		return nil, ErrUnknown
	}
	return out, nil
}

func ByBIC(bic string) (Bank, error) {
	var key [bicSize]byte
	for i := 0; i < len(bic); i++ {
		if i == bicLongSize {
			return Bank{}, ErrLength
		}
		c := bic[i]
		switch {
		case c >= 'a' && c <= 'z':
			c -= lowerToUpper
		case (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'):
		default:
			return Bank{}, ErrCharset
		}
		if i < bicSize {
			key[i] = c
		}
	}
	if len(bic) != bicSize && len(bic) != bicLongSize {
		return Bank{}, ErrLength
	}
	for _, b := range load() {
		if b.BIC == string(key[:]) {
			return b, nil
		}
	}
	return Bank{}, ErrUnknown
}
