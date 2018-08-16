package main

import (
	"github.com/astaxie/beego"

	"desktop/app/etcd"
	"fmt"
	"github.com/astaxie/beego/logs"
	_ "desktop/app/routers"
)

const VERSION = "1.0.0"

func main() {
	beego.BConfig.WebConfig.DirectoryIndex = true

	beego.SetLevel(beego.LevelInformational)
	beego.SetLogFuncCall(false)
	logs.SetLogger(logs.AdapterFile, `{"filename":"./logs/desktop.log","perm":"0664"}`)

	err := etcd.InitDB(beego.AppConfig.String("etcdendpoints"))
	if err != nil{
		fmt.Println("ETCD init fail,etcdendpoints=", beego.AppConfig.String("etcdendpoints"))
	}

	// 生产环境不输出debug日志
	if beego.AppConfig.String("runmode") == "prod" {
		beego.SetLevel(beego.LevelInformational)
	}
	beego.AppConfig.Set("version", VERSION)

	beego.BConfig.WebConfig.Session.SessionOn = true
	beego.Run()
}
