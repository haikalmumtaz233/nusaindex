package nik

import (
	"time"

	"github.com/haikalmumtaz233/nusaindex/internal/dates"
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	Size       = 16
	separators = " .-"
	maskKeep   = 4
)

var (
	ErrLength  error = errcode.New("nik", "length")
	ErrCharset error = errcode.New("nik", "charset")
	ErrRegion  error = errcode.New("nik", "region")
	ErrDate    error = errcode.New("nik", "date")
	ErrSerial  error = errcode.New("nik", "serial")
)

type NIK struct {
	Number       string `json:"nik"`
	ProvinceCode string `json:"provinceCode"`
	RegencyCode  string `json:"regencyCode"`
	DistrictCode string `json:"districtCode"`
	BirthDate    string `json:"birthDate"`
	Sex          string `json:"sex"`
	Serial       string `json:"serial"`
}

type fields struct {
	digits [Size]byte
	year   int
	month  int
	day    int
	female bool
}

func Valid(s string) bool {
	_, err := scan(s, time.Now().Year())
	return err == nil
}

func Parse(s string) (NIK, error) {
	return ParseAt(s, time.Now().Year())
}

func ParseAt(s string, referenceYear int) (NIK, error) {
	f, err := scan(s, referenceYear)
	if err != nil {
		return NIK{}, err
	}
	d := string(f.digits[:])
	sex := "male"
	if f.female {
		sex = "female"
	}
	return NIK{
		Number:       d,
		ProvinceCode: d[0:2],
		RegencyCode:  d[0:2] + "." + d[2:4],
		DistrictCode: d[0:2] + "." + d[2:4] + "." + d[4:6],
		BirthDate:    dates.ISODate(f.year, f.month, f.day),
		Sex:          sex,
		Serial:       d[12:16],
	}, nil
}

func Format(s string) (string, error) {
	f, err := scan(s, time.Now().Year())
	if err != nil {
		return "", err
	}
	return string(f.digits[:]), nil
}

func Mask(s string) string {
	return digits.Mask(s, maskKeep)
}

func scan(s string, referenceYear int) (fields, error) {
	var f fields
	n, status := digits.Collect(f.digits[:], s, separators)
	if status == digits.Charset {
		return f, ErrCharset
	}
	if status == digits.TooLong || n != Size {
		return f, ErrLength
	}
	d := f.digits[:]
	if !knownProvince(digits.Int(d[0:2])) || digits.AllZero(d[2:4]) || digits.AllZero(d[4:6]) {
		return f, ErrRegion
	}
	f.day = digits.Int(d[6:8])
	if f.day > 40 {
		f.female = true
		f.day -= 40
	}
	f.month = digits.Int(d[8:10])
	f.year = resolveYear(digits.Int(d[10:12]), referenceYear)
	if !dates.Valid(f.year, f.month, f.day) {
		return f, ErrDate
	}
	if digits.AllZero(d[12:16]) {
		return f, ErrSerial
	}
	return f, nil
}

func resolveYear(twoDigit, referenceYear int) int {
	year := 2000 + twoDigit
	if year > referenceYear {
		year -= 100
	}
	return year
}

func knownProvince(code int) bool {
	switch {
	case code >= 11 && code <= 19, code == 21, code >= 31 && code <= 36, code >= 51 && code <= 53:
		return true
	case code >= 61 && code <= 65, code >= 71 && code <= 76, code == 81, code == 82, code >= 91 && code <= 96:
		return true
	}
	return false
}
