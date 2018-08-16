package controllers

import (
	"time"
	"desktop/app/etcd"
	"github.com/astaxie/beego"
)

type ExtController struct {
	BaseController
}

// @Title Get Auth Config
// @Description get auth config
// @Success 200 {object} auth.SystemAuthConfig
// @Failure 500 {object} models.ErrorMsg
// @router /read [get]
func (this *ExtController) Read() {
	beego.Info("ExtController in node=", this.GetString("node"))
	node := this.GetString("node")
	path := "/"
	if node != "root"{
		path = node
	}
	data, err := etcd.Etcdv3Client.GetTreeList(path)
	if err != nil{
		this.Data["json"] = etcd.Result{"fail", 10000, err.Error()}
	} else{
		this.Data["json"] = data
	}
	this.ServeJSON()
}

// 获取系统时间
func (this *ExtController) GetTime() {
	out := make(map[string]interface{})
	out["time"] = time.Now().UnixNano() / int64(time.Millisecond)
	this.jsonResult(out)
}
