package data_test

import (
	"strings"
	"testing"

	"github.com/haikalmumtaz233/nusaindex/data"
)

func TestDatasetsHaveHeaders(t *testing.T) {
	cases := map[string]string{
		"code,name\n":                     data.Regions(),
		"old_code,new_code,since,basis\n": data.RegionAliases(),
		"code,region_code,basis\n":        data.PlateCodes(),
		"code,region_code,place\n":        data.AreaCodes(),
	}
	for header, text := range cases {
		if !strings.HasPrefix(text, header) {
			t.Errorf("dataset does not start with %q", header)
		}
	}
}
