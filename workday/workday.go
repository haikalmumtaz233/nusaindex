package workday

import (
	"sync"
	"time"

	"github.com/haikalmumtaz233/nusaindex/holiday"
	"github.com/haikalmumtaz233/nusaindex/internal/dates"
	"github.com/haikalmumtaz233/nusaindex/internal/errcode"
)

var (
	ErrDate    error = errcode.New("workday", "date")
	ErrRange   error = errcode.New("workday", "range")
	ErrOptions error = errcode.New("workday", "options")
)

type Options struct {
	Weekend                  []time.Weekday
	CollectiveLeaveIsWorkday bool
}

type calendar struct {
	weekend      [7]bool
	leaveWorkday bool
}

type dayOff struct {
	national bool
	leave    bool
}

var daysOff = sync.OnceValue(func() map[string]dayOff {
	out := make(map[string]dayOff, 200)
	c := holiday.Years()
	for year := c.From; year <= c.To; year++ {
		list, _ := holiday.InYear(year)
		for _, h := range list {
			d := out[h.Date]
			if h.Kind == holiday.KindNational {
				d.national = true
			} else {
				d.leave = true
			}
			out[h.Date] = d
		}
	}
	return out
})

func IsWorkday(date string, opts Options) (bool, error) {
	cal, err := newCalendar(opts)
	if err != nil {
		return false, err
	}
	t, err := parse(date)
	if err != nil {
		return false, err
	}
	return cal.works(t), nil
}

func Add(date string, days int, opts Options) (string, error) {
	cal, err := newCalendar(opts)
	if err != nil {
		return "", err
	}
	t, err := parse(date)
	if err != nil {
		return "", err
	}
	step, remaining := 1, days
	if days < 0 {
		step, remaining = -1, -days
	}
	for remaining > 0 {
		t = t.AddDate(0, 0, step)
		if !covered(t) {
			return "", ErrRange
		}
		if cal.works(t) {
			remaining--
		}
	}
	return t.Format(time.DateOnly), nil
}

func Count(from, to string, opts Options) (int, error) {
	cal, err := newCalendar(opts)
	if err != nil {
		return 0, err
	}
	start, err := parse(from)
	if err != nil {
		return 0, err
	}
	end, err := parse(to)
	if err != nil {
		return 0, err
	}
	if start.After(end) {
		return 0, ErrRange
	}
	n := 0
	for t := start; !t.After(end); t = t.AddDate(0, 0, 1) {
		if cal.works(t) {
			n++
		}
	}
	return n, nil
}

func newCalendar(opts Options) (calendar, error) {
	cal := calendar{leaveWorkday: opts.CollectiveLeaveIsWorkday}
	weekend := opts.Weekend
	if weekend == nil {
		weekend = []time.Weekday{time.Saturday, time.Sunday}
	}
	off := 0
	for _, d := range weekend {
		if d < time.Sunday || d > time.Saturday {
			return calendar{}, ErrOptions
		}
		if !cal.weekend[d] {
			cal.weekend[d] = true
			off++
		}
	}
	if off == len(cal.weekend) {
		return calendar{}, ErrOptions
	}
	return cal, nil
}

func (c calendar) works(t time.Time) bool {
	if c.weekend[t.Weekday()] {
		return false
	}
	d := daysOff()[t.Format(time.DateOnly)]
	return !d.national && (!d.leave || c.leaveWorkday)
}

func parse(date string) (time.Time, error) {
	year, month, day, ok := dates.ParseISO(date)
	if !ok {
		return time.Time{}, ErrDate
	}
	t := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	if !covered(t) {
		return time.Time{}, ErrRange
	}
	return t, nil
}

func covered(t time.Time) bool {
	c := holiday.Years()
	return t.Year() >= c.From && t.Year() <= c.To
}
