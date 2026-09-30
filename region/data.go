package region

import (
	"sort"
	"strings"
	"sync"

	"github.com/haikalmumtaz233/nusaindex/data"
	"github.com/haikalmumtaz233/nusaindex/internal/csvx"
)

type record struct {
	code string
	name string
}

type dataset struct {
	records   []record
	provinces []int
	aliases   map[string]string
}

var load = sync.OnceValue(func() *dataset {
	d := &dataset{records: make([]record, 0, 91600), aliases: make(map[string]string, 700)}
	csvx.Each(data.Regions(), func(f []string) {
		if len(f[0]) == provinceSize {
			d.provinces = append(d.provinces, len(d.records))
		}
		d.records = append(d.records, record{code: f[0], name: f[1]})
	})
	csvx.Each(data.RegionAliases(), func(f []string) {
		d.aliases[f[0]] = f[1]
	})
	return d
})

func (d *dataset) find(code string) (int, bool) {
	i := sort.Search(len(d.records), func(i int) bool { return d.records[i].code >= code })
	return i, i < len(d.records) && d.records[i].code == code
}

func (d *dataset) region(i int) Region {
	r := d.records[i]
	return Region{Code: r.code, Name: r.name, Level: levelOf(r.code), ParentCode: parentOf(r.code)}
}

func (d *dataset) descendants(code string) []record {
	start, _ := d.find(code + ".")
	end := sort.Search(len(d.records), func(i int) bool { return d.records[i].code >= code+"/" })
	return d.records[start:end]
}

func parentOf(code string) string {
	if i := strings.LastIndexByte(code, '.'); i >= 0 {
		return code[:i]
	}
	return ""
}
