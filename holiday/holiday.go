package holiday

import (
	"sort"
	"sync"

	"github.com/haikalmumtaz233/nusaindex/data"
	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
	"github.com/haikalmumtaz233/nusaindex/internal/dates"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

const (
	KindNational        = "national"
	KindCollectiveLeave = "collective_leave"
)

var (
	ErrDate  error = errcode.New("holiday", "date")
	ErrRange error = errcode.New("holiday", "range")
)

type Holiday struct {
	Date   string `json:"date"`
	Kind   string `json:"kind"`
	Name   string `json:"name"`
	NameEN string `json:"nameEn"`
	Basis  string `json:"basis"`
}

type Coverage struct {
	From int `json:"from"`
	To   int `json:"to"`
}

type dataset struct {
	holidays []Holiday
	coverage Coverage
}

var load = sync.OnceValue(func() *dataset {
	d := &dataset{holidays: make([]Holiday, 0, 200)}
	csvx.Each(data.Holidays(), func(f []string) {
		d.holidays = append(d.holidays, Holiday{Date: f[0], Kind: f[1], Name: f[2], NameEN: f[3], Basis: f[4]})
	})
	first, _, _, _ := dates.ParseISO(d.holidays[0].Date)
	last, _, _, _ := dates.ParseISO(d.holidays[len(d.holidays)-1].Date)
	d.coverage = Coverage{From: first, To: last}
	return d
})

func Years() Coverage {
	return load().coverage
}

func InYear(year int) ([]Holiday, error) {
	c := Years()
	if year < c.From || year > c.To {
		return nil, ErrRange
	}
	return span(dates.ISODate(year, 1, 1), dates.ISODate(year, 12, 31)), nil
}

func Between(from, to string) ([]Holiday, error) {
	if err := check(from); err != nil {
		return nil, err
	}
	if err := check(to); err != nil {
		return nil, err
	}
	if from > to {
		return nil, ErrRange
	}
	return span(from, to), nil
}

func On(date string) ([]Holiday, error) {
	if err := check(date); err != nil {
		return nil, err
	}
	return span(date, date), nil
}

func check(date string) error {
	year, _, _, ok := dates.ParseISO(date)
	if !ok {
		return ErrDate
	}
	if c := Years(); year < c.From || year > c.To {
		return ErrRange
	}
	return nil
}

func span(from, to string) []Holiday {
	all := load().holidays
	start := sort.Search(len(all), func(i int) bool { return all[i].Date >= from })
	end := sort.Search(len(all), func(i int) bool { return all[i].Date > to })
	return append([]Holiday{}, all[start:end]...)
}
