package data

import _ "embed"

//go:embed regions.csv
var regions string

//go:embed region_aliases.csv
var regionAliases string

func Regions() string {
	return regions
}

func RegionAliases() string {
	return regionAliases
}
