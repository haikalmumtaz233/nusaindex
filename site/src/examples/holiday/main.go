package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/holiday"
)

func main() {
	coverage := holiday.Years()
	fmt.Println(coverage.From, coverage.To)

	all, err := holiday.InYear(2026)
	if err == nil {
		fmt.Println(len(all), all[0].Date, all[0].NameEN)
	}

	august, err := holiday.Between("2026-08-01", "2026-08-31")
	if err == nil {
		for _, h := range august {
			fmt.Println(h.Date, h.Kind, h.Name)
		}
	}

	christmas, err := holiday.On("2026-12-25")
	if err == nil {
		fmt.Println(len(christmas), christmas[0].Basis)
	}
}
