package fake_test

import (
	"errors"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/fake"
	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/nik"
	"github.com/haikalmumtaz233/nusaindex/nip"
	"github.com/haikalmumtaz233/nusaindex/nisn"
	"github.com/haikalmumtaz233/nusaindex/npwp"
	"github.com/haikalmumtaz233/nusaindex/phone"
	"github.com/haikalmumtaz233/nusaindex/plate"
	"github.com/haikalmumtaz233/nusaindex/region"
)

const referenceYear = 2026

func seed(a []any) uint32 {
	return uint32(a[0].(float64))
}

func option(a []any, key string) string {
	if len(a) < 2 {
		return ""
	}
	m, _ := a[1].(map[string]any)
	s, _ := m[key].(string)
	return s
}

var handlers = map[string]vectortest.Func{
	"nik": func(a []any) (any, error) {
		return fake.NIK(seed(a), fake.NIKOptions{Region: option(a, "region"), BirthDate: option(a, "birthDate"), Sex: option(a, "sex")})
	},
	"nip": func(a []any) (any, error) {
		return fake.NIP(seed(a), fake.NIPOptions{BirthDate: option(a, "birthDate"), Sex: option(a, "sex")})
	},
	"plate": func(a []any) (any, error) { return fake.Plate(seed(a), fake.PlateOptions{Region: option(a, "region")}) },
	"npwp":  func(a []any) (any, error) { return fake.NPWP(seed(a)), nil },
	"phone": func(a []any) (any, error) { return fake.Phone(seed(a)), nil },
	"nisn":  func(a []any) (any, error) { return fake.NISN(seed(a)), nil },
}

func TestVectors(t *testing.T) {
	vectortest.Run(t, "fake", handlers)
}

func TestNIKMatchesOptions(t *testing.T) {
	for s := range uint32(300) {
		n, err := fake.NIK(s, fake.NIKOptions{})
		if err != nil {
			t.Fatal(err)
		}
		p, err := nik.ParseAt(n, referenceYear)
		if err != nil {
			t.Fatalf("seed %d: invalid nik %s: %v", s, n, err)
		}
		if r, err := region.Get(p.DistrictCode); err != nil || r.Level != region.LevelDistrict {
			t.Fatalf("seed %d: unknown district %s", s, p.DistrictCode)
		}
		fixed, err := fake.NIK(s, fake.NIKOptions{Region: p.RegencyCode, BirthDate: "1999-12-31", Sex: fake.SexFemale})
		if err != nil {
			t.Fatal(err)
		}
		q, err := nik.ParseAt(fixed, referenceYear)
		if err != nil || q.RegencyCode != p.RegencyCode || q.BirthDate != "1999-12-31" || q.Sex != fake.SexFemale {
			t.Fatalf("seed %d: options ignored: %+v (%v)", s, q, err)
		}
	}
}

func TestOthersAreValid(t *testing.T) {
	for s := range uint32(2000) {
		n, err := fake.NIP(s, fake.NIPOptions{})
		if err != nil || !nip.Valid(n) {
			t.Fatalf("seed %d: invalid nip %s (%v)", s, n, err)
		}
		p, err := fake.Plate(s, fake.PlateOptions{})
		if err != nil || !plate.Valid(p) {
			t.Fatalf("seed %d: invalid plate %s (%v)", s, p, err)
		}
		if v := fake.NPWP(s); !npwp.Valid(v) {
			t.Fatalf("seed %d: invalid npwp %s", s, v)
		}
		if v := fake.Phone(s); !phone.Valid(v) {
			t.Fatalf("seed %d: invalid phone %s", s, v)
		}
		if v := fake.NISN(s); !nisn.Valid(v) {
			t.Fatalf("seed %d: invalid nisn %s", s, v)
		}
	}
}

func TestSentinelErrors(t *testing.T) {
	if _, err := fake.NIK(1, fake.NIKOptions{Region: "99"}); !errors.Is(err, fake.ErrRegion) {
		t.Fatalf("want ErrRegion, got %v", err)
	}
	if _, err := fake.NIP(1, fake.NIPOptions{BirthDate: "1990-02-30"}); !errors.Is(err, fake.ErrDate) {
		t.Fatalf("want ErrDate, got %v", err)
	}
	if _, err := fake.NIK(1, fake.NIKOptions{Sex: "x"}); !errors.Is(err, fake.ErrOptions) {
		t.Fatalf("want ErrOptions, got %v", err)
	}
}

func FuzzSeed(f *testing.F) {
	f.Add(uint32(0))
	f.Add(uint32(4294967295))
	f.Fuzz(func(t *testing.T, s uint32) {
		n, err := fake.NIK(s, fake.NIKOptions{})
		if err != nil {
			t.Fatal(err)
		}
		if _, err := nik.ParseAt(n, referenceYear); err != nil {
			t.Fatalf("seed %d: invalid nik %s: %v", s, n, err)
		}
		p, err := fake.Plate(s, fake.PlateOptions{})
		if err != nil || !plate.Valid(p) || !npwp.Valid(fake.NPWP(s)) || !phone.Valid(fake.Phone(s)) {
			t.Fatalf("seed %d: invalid value", s)
		}
	})
}
