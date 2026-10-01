package fake

import (
	"slices"
	"strconv"
	"sync"
	"time"

	"github.com/haikalmumtaz233/nusaindex/data"
	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
	"github.com/haikalmumtaz233/nusaindex/internal/dates"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
	"github.com/haikalmumtaz233/nusaindex/region"
)

const (
	SexMale   = "male"
	SexFemale = "female"

	femaleDayOffset = 40
	adultAge        = 18
	serviceYears    = 17
)

var (
	ErrOptions error = errcode.New("fake", "options")
	ErrDate    error = errcode.New("fake", "date")
	ErrRegion  error = errcode.New("fake", "region")
)

var (
	nikBirthFrom = time.Date(1950, time.January, 1, 0, 0, 0, 0, time.UTC)
	nikBirthTo   = time.Date(2005, time.December, 31, 0, 0, 0, 0, time.UTC)
	nipBirthFrom = time.Date(1960, time.January, 1, 0, 0, 0, 0, time.UTC)
	nipBirthTo   = time.Date(2000, time.December, 31, 0, 0, 0, 0, time.UTC)
)

var mobilePrefixes = [...]string{
	"811", "812", "813", "814", "815", "816", "817", "818", "819",
	"821", "822", "823", "831", "832", "833", "838",
	"851", "852", "853", "855", "856", "857", "858", "859",
	"877", "878", "881", "882", "883", "884", "885", "886", "887", "888", "889",
	"895", "896", "897", "898", "899",
}

type NIKOptions struct {
	Region    string
	BirthDate string
	Sex       string
}

type NIPOptions struct {
	BirthDate string
	Sex       string
}

type PlateOptions struct {
	Region string
}

func NIK(seed uint32, o NIKOptions) (string, error) {
	if err := checkSex(o.Sex); err != nil {
		return "", err
	}
	src := newSource(seed, streamNIK)
	district, err := pickDistrict(src, o.Region)
	if err != nil {
		return "", err
	}
	birth, err := birthDate(src, o.BirthDate, nikBirthFrom, nikBirthTo)
	if err != nil {
		return "", err
	}
	day := birth.Day()
	if pickSex(src, o.Sex) == SexFemale {
		day += femaleDayOffset
	}
	serial := 1 + src.intn(9999)
	return district[0:2] + district[3:5] + district[6:8] +
		pad(day, 2) + pad(int(birth.Month()), 2) + pad(birth.Year()%100, 2) + pad(serial, 4), nil
}

func NPWP(seed uint32) string {
	src := newSource(seed, streamNPWP)
	kind := 1 + src.intn(99)
	serial := src.digits(7)
	office := 1 + src.intn(999)
	return "0" + pad(kind, 2) + serial + pad(office, 3) + "000"
}

func Phone(seed uint32) string {
	src := newSource(seed, streamPhone)
	prefix := mobilePrefixes[src.intn(len(mobilePrefixes))]
	size := 10 + src.intn(3)
	return "+62" + prefix + src.digits(size-len(prefix))
}

func NIP(seed uint32, o NIPOptions) (string, error) {
	if err := checkSex(o.Sex); err != nil {
		return "", err
	}
	src := newSource(seed, streamNIP)
	birth, err := birthDate(src, o.BirthDate, nipBirthFrom, nipBirthTo)
	if err != nil {
		return "", err
	}
	sex := "1"
	if pickSex(src, o.Sex) == SexFemale {
		sex = "2"
	}
	appointed := birth.Year() + adultAge + src.intn(serviceYears)
	month := 1 + src.intn(12)
	serial := 1 + src.intn(999)
	return birth.Format("20060102") + pad(appointed, 4) + pad(month, 2) + sex + pad(serial, 3), nil
}

func NISN(seed uint32) string {
	src := newSource(seed, streamNISN)
	n := src.digits(9)
	return n + strconv.Itoa(1+src.intn(9))
}

func Plate(seed uint32, o PlateOptions) (string, error) {
	src := newSource(seed, streamPlate)
	code := o.Region
	if code == "" {
		codes := plateCodes()
		code = codes[src.intn(len(codes))]
	} else if _, ok := slices.BinarySearch(plateCodes(), code); !ok {
		return "", ErrRegion
	}
	out := code + " " + strconv.Itoa(1+src.intn(9999))
	size := src.intn(4)
	if size == 0 {
		return out, nil
	}
	suffix := make([]byte, size)
	for i := range suffix {
		suffix[i] = letters[src.intn(len(letters))]
	}
	return out + " " + string(suffix), nil
}

var plateCodes = sync.OnceValue(func() []string {
	var codes []string
	csvx.Each(data.PlateCodes(), func(f []string) {
		codes = append(codes, f[0])
	})
	slices.Sort(codes)
	return slices.Compact(codes)
})

func pickDistrict(src *source, code string) (string, error) {
	if code != "" {
		r, err := region.Get(code)
		if err != nil {
			return "", ErrRegion
		}
		if r.Level == region.LevelVillage {
			return "", ErrOptions
		}
		code = r.Code
	}
	for len(code) < len("11.01.01") {
		children, err := region.Children(code)
		if err != nil || len(children) == 0 {
			return "", ErrRegion
		}
		code = children[src.intn(len(children))].Code
	}
	return code, nil
}

func birthDate(src *source, given string, from, to time.Time) (time.Time, error) {
	if given == "" {
		days := int(to.Sub(from).Hours()/24) + 1
		return from.AddDate(0, 0, src.intn(days)), nil
	}
	year, month, day, ok := dates.ParseISO(given)
	if !ok || year < 1900 || year > 2099 {
		return time.Time{}, ErrDate
	}
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC), nil
}

func checkSex(sex string) error {
	if sex != "" && sex != SexMale && sex != SexFemale {
		return ErrOptions
	}
	return nil
}

func pickSex(src *source, sex string) string {
	if sex != "" {
		return sex
	}
	if src.intn(2) == 0 {
		return SexMale
	}
	return SexFemale
}

func pad(n, width int) string {
	s := strconv.Itoa(n)
	for len(s) < width {
		s = "0" + s
	}
	return s
}
