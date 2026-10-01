package main

import (
	"encoding/json"
	"fmt"

	"github.com/haikalmumtaz233/nusaindex/mask"
)

func main() {
	fmt.Println(mask.NIK("7502010706599583"))
	fmt.Println(mask.NPWP("0029736758100600"))
	fmt.Println(mask.Phone("0859-5257-171"))
	fmt.Println(mask.NIP("198812272008092553"))
	fmt.Println(mask.NISN("6299763315"))
	fmt.Println(mask.Account("1234567890"))

	line, err := mask.Text("customer 7502010706599583 called from 085952571710")
	if err == nil {
		fmt.Println(line)
	}

	record := map[string]any{
		"name":  "Budi",
		"nik":   "7502010706599583",
		"notes": []any{"call 085952571710"},
	}
	safe, err := json.Marshal(mask.Redact(record))
	if err == nil {
		fmt.Println(string(safe))
	}
}
