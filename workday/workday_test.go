package workday_test

import (
	"errors"
	"testing"
	"time"

	"github.com/haikalmumtaz233/nusaindex/internal/vectortest"
	"github.com/haikalmumtaz233/nusaindex/workday"
)

func options(args []any, i int) workday.Options {
	var o workday.Options
	if len(args) <= i {
		return o
	}
	m, _ := args[i].(map[string]any)
	if days, ok := m["weekend"].([]any); ok {
		o.Weekend = []time.Weekday{}
		for _, d := range days {
			o.Weekend = append(o.Weekend, time.Weekday(int(d.(float64))))
		}
	}
	o.CollectiveLeaveIsWorkday, _ = m["collectiveLeaveIsWorkday"].(bool)
	return o
}

func TestVectors(t *testing.T) {
	vectortest.Run(t, "workday", map[string]vectortest.Func{
		"isWorkday": func(a []any) (any, error) { return workday.IsWorkday(a[0].(string), options(a, 1)) },
		"add":       func(a []any) (any, error) { return workday.Add(a[0].(string), int(a[1].(float64)), options(a, 2)) },
		"count":     func(a []any) (any, error) { return workday.Count(a[0].(string), a[1].(string), options(a, 2)) },
	})
}

func TestAddAndCountAgree(t *testing.T) {
	start := "2025-01-02"
	for n := 1; n <= 60; n++ {
		end, err := workday.Add(start, n, workday.Options{})
		if err != nil {
			t.Fatal(err)
		}
		count, err := workday.Count(start, end, workday.Options{})
		if err != nil || count != n+1 {
			t.Fatalf("Count(%s, %s) = %d, %v; want %d", start, end, count, err, n+1)
		}
	}
}

func TestSentinelErrors(t *testing.T) {
	if _, err := workday.Add("2027-12-31", 1, workday.Options{}); !errors.Is(err, workday.ErrRange) {
		t.Fatalf("want ErrRange, got %v", err)
	}
	if _, err := workday.IsWorkday("2025-01-02", workday.Options{Weekend: []time.Weekday{9}}); !errors.Is(err, workday.ErrOptions) {
		t.Fatalf("want ErrOptions, got %v", err)
	}
}
