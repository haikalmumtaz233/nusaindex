package main

import (
	"errors"
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/plate"
)

func main() {
	fmt.Println(plate.Valid("DR 2826 IBN"))

	parsed, err := plate.Parse("dr2826ibn")
	if err == nil {
		fmt.Println(parsed.Region, parsed.Number, parsed.Suffix)
	}

	formatted, err := plate.Format("b-1234-xyz")
	if err == nil {
		fmt.Println(formatted)
	}

	_, err = plate.Parse("QQ 1234 AB")
	fmt.Println(errors.Is(err, plate.ErrRegion))
}
