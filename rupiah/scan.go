package rupiah

type scanner struct {
	s        string
	i        int
	overflow bool
	value    int64
	count    int
}

func (sc *scanner) amount() (parts, bool) {
	var p parts
	sc.spaces()
	p.negative = sc.accept('-')
	sc.spaces()
	if sc.symbol() {
		sc.spaces()
	}
	if !sc.number() {
		return parts{}, false
	}
	sen, ok := sc.decimals()
	if !ok {
		return parts{}, false
	}
	sc.spaces()
	if sc.i != len(sc.s) {
		return parts{}, false
	}
	p.whole = sc.value
	p.sen = sen
	p.negative = p.negative && (p.whole != 0 || p.sen != 0)
	return p, true
}

func (sc *scanner) peek() byte {
	if sc.i < len(sc.s) {
		return sc.s[sc.i]
	}
	return 0
}

func (sc *scanner) accept(c byte) bool {
	if sc.peek() == c {
		sc.i++
		return true
	}
	return false
}

func (sc *scanner) spaces() {
	for sc.accept(' ') {
	}
}

func (sc *scanner) symbol() bool {
	if sc.word("rp") {
		sc.accept('.')
		return true
	}
	return sc.word("idr")
}

func (sc *scanner) word(w string) bool {
	if len(sc.s)-sc.i < len(w) {
		return false
	}
	for j := 0; j < len(w); j++ {
		if sc.s[sc.i+j]|0x20 != w[j] {
			return false
		}
	}
	sc.i += len(w)
	return true
}

func (sc *scanner) number() bool {
	lead := sc.digits()
	if lead == 0 {
		return false
	}
	if sc.peek() != '.' {
		return true
	}
	if lead > 3 {
		return false
	}
	for sc.accept('.') {
		if sc.digits() != 3 {
			return false
		}
	}
	return true
}

func (sc *scanner) digits() int {
	n := 0
	for c := sc.peek(); c >= '0' && c <= '9'; c = sc.peek() {
		sc.push(int64(c - '0'))
		sc.i++
		n++
	}
	return n
}

func (sc *scanner) push(d int64) {
	if sc.count == 0 && d == 0 {
		return
	}
	sc.count++
	if sc.count > maxDigits {
		sc.overflow = true
		return
	}
	sc.value = sc.value*10 + d
}

func (sc *scanner) decimals() (int64, bool) {
	if !sc.accept(',') {
		return 0, true
	}
	if sc.accept('-') {
		return 0, true
	}
	var sen int64
	n := 0
	for c := sc.peek(); c >= '0' && c <= '9'; c = sc.peek() {
		if n == 2 {
			return 0, false
		}
		sen = sen*10 + int64(c-'0')
		sc.i++
		n++
	}
	switch n {
	case 1:
		return sen * 10, true
	case 2:
		return sen, true
	}
	return 0, false
}
