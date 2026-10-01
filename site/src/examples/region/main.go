package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/region"
)

func main() {
	regency, err := region.Get("31.71")
	if err == nil {
		fmt.Println(regency.Name, regency.Level, regency.ParentCode)
	}

	districts, err := region.Children("31.71")
	if err == nil {
		fmt.Println(len(districts), districts[0].Name)
	}

	found, err := region.Search("gambir", region.SearchOptions{Level: region.LevelDistrict, Limit: 2})
	if err == nil {
		for _, r := range found {
			fmt.Println(r.Code, r.Name)
		}
	}

	current, err := region.Resolve("91.04")
	if err == nil {
		fmt.Println(current.Code, current.Name)
	}

	byPlate, err := region.ByPlate("DR")
	if err == nil {
		fmt.Println(len(byPlate), byPlate[0].Name)
	}

	byArea, err := region.ByAreaCode("0274")
	if err == nil {
		fmt.Println(byArea[0].Code, byArea[0].Name)
	}

	place, err := region.FromNIK("7502010706599583")
	if err == nil {
		fmt.Println(place.Province.Name, place.Regency.Name, place.District.Name, place.Historical)
	}
}
