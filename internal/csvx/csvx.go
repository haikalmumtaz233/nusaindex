package csvx

import "strings"

func Each(text string, fn func(fields []string)) {
	fields := make([]string, 0, 8)
	header := true
	for text != "" {
		fields = fields[:0]
		for {
			var field string
			var end bool
			field, text, end = next(text)
			fields = append(fields, field)
			if end {
				break
			}
		}
		if header {
			header = false
			continue
		}
		fn(fields)
	}
}

func next(text string) (field, rest string, end bool) {
	if strings.HasPrefix(text, `"`) {
		return quoted(text)
	}
	i := strings.IndexAny(text, ",\n")
	if i < 0 {
		return text, "", true
	}
	return text[:i], text[i+1:], text[i] == '\n'
}

func quoted(text string) (field, rest string, end bool) {
	var b strings.Builder
	i := 1
	for i < len(text) {
		c := text[i]
		i++
		if c != '"' {
			b.WriteByte(c)
			continue
		}
		if i < len(text) && text[i] == '"' {
			b.WriteByte('"')
			i++
			continue
		}
		break
	}
	if i >= len(text) {
		return b.String(), "", true
	}
	return b.String(), text[i+1:], text[i] == '\n'
}
