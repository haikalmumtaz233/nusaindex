package dates

func IsLeap(year int) bool {
	return year%4 == 0 && (year%100 != 0 || year%400 == 0)
}

func DaysInMonth(year, month int) int {
	switch month {
	case 2:
		if IsLeap(year) {
			return 29
		}
		return 28
	case 4, 6, 9, 11:
		return 30
	default:
		return 31
	}
}

func Valid(year, month, day int) bool {
	if year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 {
		return false
	}
	return day <= DaysInMonth(year, month)
}

func ParseISO(s string) (year, month, day int, ok bool) {
	if len(s) != 10 || s[4] != '-' || s[7] != '-' {
		return 0, 0, 0, false
	}
	year, okYear := number(s[0:4])
	month, okMonth := number(s[5:7])
	day, okDay := number(s[8:10])
	if !okYear || !okMonth || !okDay || !Valid(year, month, day) {
		return 0, 0, 0, false
	}
	return year, month, day, true
}

func number(s string) (int, bool) {
	v := 0
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return 0, false
		}
		v = v*10 + int(s[i]-'0')
	}
	return v, true
}

func ISODate(year, month, day int) string {
	b := make([]byte, 0, 10)
	b = appendPadded(b, year, 4)
	b = append(b, '-')
	b = appendPadded(b, month, 2)
	b = append(b, '-')
	b = appendPadded(b, day, 2)
	return string(b)
}

func ISOMonth(year, month int) string {
	b := make([]byte, 0, 7)
	b = appendPadded(b, year, 4)
	b = append(b, '-')
	b = appendPadded(b, month, 2)
	return string(b)
}

func appendPadded(b []byte, v, width int) []byte {
	var tmp [4]byte
	for i := width - 1; i >= 0; i-- {
		tmp[i] = byte('0' + v%10)
		v /= 10
	}
	return append(b, tmp[:width]...)
}
