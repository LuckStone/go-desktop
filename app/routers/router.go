// @APIVersion 1.0.0
// @Title ufleet project user module
// @Description ufleet project
// @Contact alfred.huang@youruncloud.com
package routers

import (
    "desktop/app/controllers"

    "github.com/astaxie/beego"
    "html/template"
    "net/http"
)

func page_not_found(rw http.ResponseWriter, r *http.Request){
    beego.Info("beego.BConfig.WebConfig.ViewsPath=", beego.BConfig.WebConfig.ViewsPath)
    t,_:= template.New("404.html").ParseFiles(beego.BConfig.WebConfig.ViewsPath + "/404.html")
    data :=make(map[string]interface{})
    data["content"] = "page not found"
    t.Execute(rw, data)
}

func init() {
    // 设置默认404页面
    beego.ErrorHandler("404",page_not_found)

    beego.Router("/", &controllers.IndexController{}, "*:Index")

    ns := beego.NewNamespace("/v1",
        beego.NSNamespace("/etcd",
            beego.NSInclude(
                &controllers.ExtController{},
            ),
        ),
    )
    beego.AddNamespace(ns)
}
