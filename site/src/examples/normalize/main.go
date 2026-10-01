package main

import (
	"errors"
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/nik"
	"github.com/haikalmumtaz233/nusaindex/normalize"
)

func main() {
	pasted := "７５０２０１０７０６５９９５８３\u200b"

	_, err := nik.Parse(pasted)
	fmt.Println(errors.Is(err, nik.ErrCharset))

	clean := normalize.Text(pasted)
	fmt.Println(clean, nik.Valid(clean))
}
