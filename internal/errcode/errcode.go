package errcode

import "errors"

type Error struct {
	pkg  string
	code string
}

func New(pkg, code string) *Error {
	return &Error{pkg: pkg, code: code}
}

func (e *Error) Error() string {
	return e.pkg + ": invalid " + e.code
}

func (e *Error) Code() string {
	return e.code
}

func Of(err error) string {
	var e *Error
	if errors.As(err, &e) {
		return e.code
	}
	return ""
}
