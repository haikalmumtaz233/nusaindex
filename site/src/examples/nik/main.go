package main

import (
	"errors"
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/nik"
)

func main() {
	fmt.Println(nik.Valid("7502010706599583"))

	parsed, err := nik.Parse("7502010706599583")
	if err == nil {
		fmt.Println(parsed.DistrictCode, parsed.BirthDate, parsed.Sex, parsed.Serial)
	}

	older, err := nik.ParseAt("3315101003154137", 2010)
	if err == nil {
		fmt.Println(older.BirthDate)
	}

	formatted, err := nik.Format("7502 0107 0659 9583")
	if err == nil {
		fmt.Println(formatted)
	}

	fmt.Println(nik.Mask("7502010706599583"))

	_, err = nik.Parse("7502013206599583")
	fmt.Println(errors.Is(err, nik.ErrDate))
}
