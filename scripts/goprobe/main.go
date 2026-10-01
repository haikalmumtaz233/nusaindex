package main

import (
	"encoding/json"
	"os"
	"runtime"
	"time"

	"github.com/haikalmumtaz233/nusaindex/region"
)

type report struct {
	RegionLoadMs   float64 `json:"regionLoadMs"`
	RegionHeapMiB  float64 `json:"regionHeapMiB"`
	RegionVillages int     `json:"regionVillages"`
}

func main() {
	runtime.GC()
	var before runtime.MemStats
	runtime.ReadMemStats(&before)

	start := time.Now()
	villages, err := region.Children("31.71.01")
	elapsed := time.Since(start)
	if err != nil {
		os.Exit(1)
	}

	runtime.GC()
	var after runtime.MemStats
	runtime.ReadMemStats(&after)

	out := report{
		RegionLoadMs:   float64(elapsed.Microseconds()) / 1000,
		RegionHeapMiB:  float64(after.HeapAlloc-before.HeapAlloc) / (1 << 20),
		RegionVillages: len(villages),
	}
	if err := json.NewEncoder(os.Stdout).Encode(out); err != nil {
		os.Exit(1)
	}
}
