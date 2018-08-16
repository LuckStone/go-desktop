package routers

import (
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context/param"
)

func init() {

	beego.GlobalControllerRouter["desktop/app/controllers:ExtController"] = append(beego.GlobalControllerRouter["desktop/app/controllers:ExtController"],
		beego.ControllerComments{
			Method: "Read",
			Router: `/read`,
			AllowHTTPMethods: []string{"get"},
			MethodParams: param.Make(),
			Params: nil})

}
