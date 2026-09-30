package region

import "github.com/haikalmumtaz233/nusaindex/nik"

type Place struct {
	Province   Region  `json:"province"`
	Regency    *Region `json:"regency,omitempty"`
	District   *Region `json:"district,omitempty"`
	Historical bool    `json:"historical"`
}

func FromNIK(s string) (Place, error) {
	n, err := nik.Parse(s)
	if err != nil {
		return Place{}, err
	}
	d := load()
	district, movedDistrict := d.current(n.DistrictCode)
	regency, movedRegency := d.current(n.RegencyCode)
	if district != "" {
		regency, movedRegency = district[:regencySize], false
	}
	province := n.ProvinceCode
	if regency != "" {
		province = regency[:provinceSize]
	}
	i, ok := d.find(province)
	if !ok {
		return Place{}, ErrUnknown
	}
	p := Place{Province: d.region(i), Historical: movedDistrict || movedRegency}
	if regency != "" {
		r := d.region(d.index(regency))
		p.Regency = &r
	}
	if district != "" {
		r := d.region(d.index(district))
		p.District = &r
	}
	return p, nil
}

func (d *dataset) current(code string) (string, bool) {
	if _, ok := d.find(code); ok {
		return code, false
	}
	if moved, ok := d.aliases[code]; ok {
		return moved, true
	}
	return "", false
}

func (d *dataset) index(code string) int {
	i, _ := d.find(code)
	return i
}
