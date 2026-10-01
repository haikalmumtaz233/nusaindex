package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/nik"
	"github.com/haikalmumtaz233/nusaindex/phone"
	"github.com/haikalmumtaz233/nusaindex/rupiah"
)

func main() {
	person, err := nik.Parse("3273275705901349")
	if err == nil {
		fmt.Println(person.BirthDate, person.Sex)
	}

	mobile, err := phone.Parse("0859-5257-171")
	if err == nil {
		fmt.Println(mobile.E164, mobile.Brand)
	}

	words, err := rupiah.Terbilang(1_500_000*rupiah.Rupiah + 50*rupiah.Sen)
	if err == nil {
		fmt.Println(words)
	}
}
