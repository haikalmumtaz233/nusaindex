package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/nip"
)

func main() {
	fmt.Println(nip.Valid("198812272008092553"))

	civil, err := nip.Parse("198812272008092553")
	if err == nil {
		fmt.Println(civil.Kind, civil.BirthDate, civil.AppointmentDate, civil.Sex)
	}

	contract, err := nip.Parse("199005172021212541")
	if err == nil {
		fmt.Println(contract.Kind, contract.AppointmentDate, contract.Agreement)
	}

	formatted, err := nip.Format("198812272008092553")
	if err == nil {
		fmt.Println(formatted)
	}

	fmt.Println(nip.Mask("198812272008092553"))
}
