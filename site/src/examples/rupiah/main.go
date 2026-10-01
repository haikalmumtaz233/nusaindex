package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/rupiah"
)

func main() {
	price := 1_500_000*rupiah.Rupiah + 50*rupiah.Sen

	text, err := rupiah.Format(price, rupiah.Options{})
	if err == nil {
		fmt.Println(text)
	}

	plain, err := rupiah.Format(2_000_000*rupiah.Rupiah, rupiah.Options{Decimals: true, OmitSymbol: true})
	if err == nil {
		fmt.Println(plain)
	}

	fmt.Println(rupiah.Valid("Rp 25.000,-"))

	amount, err := rupiah.Parse("Rp 25.000,-")
	if err == nil {
		fmt.Println(int64(amount / rupiah.Rupiah))
	}

	words, err := rupiah.Terbilang(price)
	if err == nil {
		fmt.Println(words)
	}
}
