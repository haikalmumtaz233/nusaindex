package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/bank"
)

func main() {
	fmt.Println(len(bank.List()) > 100)

	banks, err := bank.ByCode("014")
	if err == nil {
		for _, b := range banks {
			fmt.Println(b.Code, b.ShortName, b.BIC, b.ShariaUnit)
		}
	}

	found, err := bank.ByBIC("BMRIIDJA")
	if err == nil {
		fmt.Println(found.Code, found.Name)
	}
}
