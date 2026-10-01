package main

import (
	"fmt"
	"time"

	"github.com/haikalmumtaz233/nusaindex/workday"
)

func main() {
	open, err := workday.IsWorkday("2026-08-17", workday.Options{})
	if err == nil {
		fmt.Println(open)
	}

	due, err := workday.Add("2026-08-14", 3, workday.Options{})
	if err == nil {
		fmt.Println(due)
	}

	days, err := workday.Count("2026-08-01", "2026-08-31", workday.Options{})
	if err == nil {
		fmt.Println(days)
	}

	sixDay := workday.Options{Weekend: []time.Weekday{time.Sunday}, CollectiveLeaveIsWorkday: true}
	days, err = workday.Count("2026-08-01", "2026-08-31", sixDay)
	if err == nil {
		fmt.Println(days)
	}
}
