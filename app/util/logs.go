package util

import (
	"github.com/astaxie/beego"
)

func Debug(v ...interface{}) {
	beego.Debug(v...)
}

func Info(v ...interface{}) {
	beego.Info(v...)
}

func Warn(v ...interface{}) {
	beego.Warn(v...)
}

func Warning(v ...interface{}) {
	beego.Warning(v...)
}

func Error(v ...interface{}) {
	beego.Error(v...)
}

func Critical(v ...interface{}) {
	beego.Critical(v...)
}