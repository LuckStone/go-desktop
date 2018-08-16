package controllers

import (
	"time"
)

type IndexController struct {
	BaseController
}

// 首页
func (this *IndexController) Index() {
	// this.TplName = "main/login.html"
	this.display()
}

// 获取系统时间
func (this *IndexController) GetTime() {
	out := make(map[string]interface{})
	out["time"] = time.Now().UnixNano() / int64(time.Millisecond)
	this.jsonResult(out)
}
