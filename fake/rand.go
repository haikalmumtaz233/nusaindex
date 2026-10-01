package fake

const (
	decimal = "0123456789"
	letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
)

type source struct {
	state uint32
}

type stream uint32

const (
	streamNIK stream = iota + 1
	streamNPWP
	streamPhone
	streamNIP
	streamNISN
	streamPlate
)

func newSource(seed uint32, st stream) *source {
	h := seed ^ uint32(st)*0x9E3779B9
	h ^= h >> 16
	h *= 0x85EBCA6B
	h ^= h >> 13
	h *= 0xC2B2AE35
	h ^= h >> 16
	return &source{state: h}
}

func (s *source) next() uint32 {
	s.state += 0x6D2B79F5
	t := s.state
	t = (t ^ (t >> 15)) * (t | 1)
	t ^= t + (t^(t>>7))*(t|61)
	return t ^ (t >> 14)
}

func (s *source) intn(n int) int {
	return int(int64(s.next()) % int64(n))
}

func (s *source) digits(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = decimal[s.intn(len(decimal))]
	}
	return string(b)
}
