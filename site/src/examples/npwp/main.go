package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/npwp"
)

func main() {
	fmt.Println(npwp.Valid("02.973.675.8-100.600"))

	parsed, err := npwp.Parse("02.973.675.8-100.600")
	if err == nil {
		fmt.Println(parsed.NPWP16, parsed.NPWP15, parsed.TaxOffice, parsed.IsNIK)
	}

	sixteen, err := npwp.To16("029736758100600")
	if err == nil {
		fmt.Println(sixteen)
	}

	formatted, err := npwp.Format("029736758100600")
	if err == nil {
		fmt.Println(formatted)
	}

	fmt.Println(npwp.Mask("0029736758100600"))
}
