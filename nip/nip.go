package nip

import (
	"github.com/haikalmumtaz233/nusaindex/internal/dates"
	"github.com/haikalmumtaz233/nusaindex/internal/digits"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	Size           = 18
	separators     = " .-"
	maskKeep       = 4
	minYear        = 1900
	firstAgreement = 21
)

var (
	ErrLength  error = errcode.New("nip", "length")
	ErrCharset error = errcode.New("nip", "charset")
	ErrDate    error = errcode.New("nip", "date")
	ErrSex     error = errcode.New("nip", "sex")
	ErrSerial  error = errcode.New("nip", "serial")
)

type NIP struct {
	Number          string `json:"nip"`
	BirthDate       string `json:"birthDate"`
	AppointmentDate string `json:"appointmentDate"`
	Sex             string `json:"sex"`
	Serial          string `json:"serial"`
}

func Valid(s string) bool {
	var buf [Size]byte
	return scan(buf[:], s) == nil
}

func Parse(s string) (NIP, error) {
	var buf [Size]byte
	if err := scan(buf[:], s); err != nil {
		return NIP{}, err
	}
	d := buf[:]
	sex := "male"
	if d[14] == '2' {
		sex = "female"
	}
	appointment := string(d[8:12])
	if code := digits.Int(d[12:14]); code < firstAgreement {
		appointment = dates.ISOMonth(digits.Int(d[8:12]), code)
	}
	return NIP{
		Number:          string(d),
		BirthDate:       dates.ISODate(digits.Int(d[0:4]), digits.Int(d[4:6]), digits.Int(d[6:8])),
		AppointmentDate: appointment,
		Sex:             sex,
		Serial:          string(d[15:18]),
	}, nil
}

func Format(s string) (string, error) {
	var buf [Size]byte
	if err := scan(buf[:], s); err != nil {
		return "", err
	}
	d := string(buf[:])
	return d[0:8] + " " + d[8:14] + " " + d[14:15] + " " + d[15:18], nil
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
	birthYear := digits.Int(d[0:4])
	if birthYear < minYear || !dates.Valid(birthYear, digits.Int(d[4:6]), digits.Int(d[6:8])) {
		return ErrDate
	}
	appointmentYear := digits.Int(d[8:12])
	code := digits.Int(d[12:14])
	if appointmentYear <= birthYear || (code < firstAgreement && !dates.Valid(appointmentYear, code, 1)) {
		return ErrDate
	}
	if d[14] != '1' && d[14] != '2' {
		return ErrSex
	}
	if digits.AllZero(d[15:18]) {
		return ErrSerial
	}
	return nil
}
