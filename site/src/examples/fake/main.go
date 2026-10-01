package main

import (
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/fake"
)

func main() {
	id, err := fake.NIK(7, fake.NIKOptions{Region: "31.71", BirthDate: "1990-05-17", Sex: fake.SexFemale})
	if err == nil {
		fmt.Println(id)
	}

	fmt.Println(fake.NPWP(3))
	fmt.Println(fake.Phone(11))
	fmt.Println(fake.NISN(7))

	employee, err := fake.NIP(5, fake.NIPOptions{BirthDate: "1990-05-17", Sex: fake.SexFemale})
	if err == nil {
		fmt.Println(employee)
	}

	car, err := fake.Plate(7, fake.PlateOptions{Region: "B"})
	if err == nil {
		fmt.Println(car)
	}
}
