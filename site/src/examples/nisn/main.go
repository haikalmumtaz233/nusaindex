package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/nisn"
)

func main() {
	fmt.Println(nisn.Valid("6299763315"))

	parsed, err := nisn.Parse(" 6299763315 ")
	if err == nil {
		fmt.Println(parsed.Number)
	}

	formatted, err := nisn.Format("6299763315")
	if err == nil {
		fmt.Println(formatted)
	}

	fmt.Println(nisn.Mask("6299763315"))
}
