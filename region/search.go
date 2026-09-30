package region

import (
	"sort"
	"strings"
	"sync"
)

const (
	maxQuery     = 256
	defaultLimit = 10
	maxLimit     = 100
)

var namePrefixes = []string{"kabupaten administrasi ", "kota administrasi ", "kabupaten ", "kota "}

type SearchOptions struct {
	Level  string
	Within string
	Limit  int
}

type match struct {
	index int
	score int
}

var foldedNames = sync.OnceValue(func() []string {
	d := load()
	out := make([]string, len(d.records))
	for i, r := range d.records {
		out[i] = fold(r.name)
	}
	return out
})

func Search(query string, opts SearchOptions) ([]Region, error) {
	q, err := searchQuery(query)
	if err != nil {
		return nil, err
	}
	limit, size, err := searchOptions(opts)
	if err != nil {
		return nil, err
	}
	d := load()
	start, end := 0, len(d.records)
	if opts.Within != "" {
		within, wErr := normalizeCode(opts.Within)
		if wErr != nil {
			return nil, wErr
		}
		if _, ok := d.find(within); !ok {
			return nil, ErrUnknown
		}
		start, _ = d.find(within + ".")
		end = start + len(d.descendants(within))
	}
	names := foldedNames()
	var matches []match
	for i := start; i < end; i++ {
		if size != 0 && len(d.records[i].code) != size {
			continue
		}
		if s := score(names[i], q); s >= 0 {
			matches = append(matches, match{index: i, score: s})
		}
	}
	sort.Slice(matches, func(a, b int) bool {
		ma, mb := matches[a], matches[b]
		if ma.score != mb.score {
			return ma.score < mb.score
		}
		la, lb := len(d.records[ma.index].code), len(d.records[mb.index].code)
		if la != lb {
			return la < lb
		}
		return ma.index < mb.index
	})
	out := make([]Region, 0, min(limit, len(matches)))
	for _, m := range matches[:min(limit, len(matches))] {
		out = append(out, d.region(m.index))
	}
	return out, nil
}

func searchQuery(query string) (string, error) {
	for i := 0; i < len(query); i++ {
		if i == maxQuery {
			return "", ErrLength
		}
		if query[i] < ' ' || query[i] > '~' {
			return "", ErrCharset
		}
	}
	q := fold(query)
	if q == "" {
		return "", ErrLength
	}
	return q, nil
}

func searchOptions(opts SearchOptions) (limit, size int, err error) {
	limit = opts.Limit
	if limit == 0 {
		limit = defaultLimit
	}
	if limit < 0 || limit > maxLimit {
		return 0, 0, ErrOptions
	}
	switch opts.Level {
	case "":
	case LevelProvince:
		size = provinceSize
	case LevelRegency:
		size = regencySize
	case LevelDistrict:
		size = districtSize
	case LevelVillage:
		size = villageSize
	default:
		return 0, 0, ErrOptions
	}
	return limit, size, nil
}

func score(name, q string) int {
	base := name
	for _, p := range namePrefixes {
		if strings.HasPrefix(name, p) {
			base = name[len(p):]
			break
		}
	}
	switch {
	case name == q || base == q:
		return 0
	case strings.HasPrefix(base, q) || strings.HasPrefix(name, q):
		return 1
	case strings.Contains(" "+name, " "+q):
		return 2
	case strings.Contains(name, q):
		return 3
	}
	return -1
}

func fold(s string) string {
	b := make([]byte, 0, len(s))
	space := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c >= 'A' && c <= 'Z':
			c += 'a' - 'A'
		case (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'):
		case c == '\'':
			continue
		default:
			space = len(b) > 0
			continue
		}
		if space {
			b = append(b, ' ')
			space = false
		}
		b = append(b, c)
	}
	return string(b)
}
