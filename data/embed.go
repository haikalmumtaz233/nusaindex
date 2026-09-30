package data

import _ "embed"

//go:embed regions.csv
var regions string

//go:embed region_aliases.csv
var regionAliases string

//go:embed plate_codes.csv
var plateCodes string

//go:embed area_codes.csv
var areaCodes string

func Regions() string {
	return regions
}

func RegionAliases() string {
	return regionAliases
}

func PlateCodes() string {
	return plateCodes
}

func AreaCodes() string {
	return areaCodes
}
