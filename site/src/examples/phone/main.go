package main

import (
	"errors"
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/phone"
)

func main() {
	fmt.Println(phone.Valid("0859-5257-171"))

	mobile, err := phone.Parse("0859-5257-171")
	if err == nil {
		fmt.Println(mobile.E164, mobile.Type, mobile.Brand, mobile.Operator)
	}

	fixed, err := phone.Parse("(021) 3456 789")
	if err == nil {
		fmt.Println(fixed.E164, fixed.Type, fixed.AreaCode)
	}

	formatted, err := phone.Format("+62 859 5257 171")
	if err == nil {
		fmt.Println(formatted)
	}

	link, err := phone.WhatsAppLink("0859-5257-171")
	if err == nil {
		fmt.Println(link)
	}

	fmt.Println(phone.Mask("0859-5257-171"))

	_, err = phone.Parse("+1 202 555 0100")
	fmt.Println(errors.Is(err, phone.ErrCountry))
}
