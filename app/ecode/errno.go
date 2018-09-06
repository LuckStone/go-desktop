package ecode

import (
	"encoding/json"
	"fmt"
)

type Error struct {
	Code    int    `json:"errorCode"`
	Message string `json:"message"`
}

const (
//EcodeDecodeError = 10000
//EcodeParamError  = 10001
)

func NewError(errorCode int, msg string) *Error {
	return &Error{
		Code:    errorCode,
		Message: msg,
	}
}

// Error is for the error interface
func (e Error) Error() string {
	return fmt.Sprintf("%s(%d)", e.Message, e.Code)
}

func (e Error) toJsonString() string {
	b, _ := json.Marshal(e)
	return string(b)
}

func ErrorCode(err error) int {
	var code int
	if errorno, ok := err.(*Error); ok {
		code = errorno.Code
	} else {
		code = -1
	}
	return code
}
