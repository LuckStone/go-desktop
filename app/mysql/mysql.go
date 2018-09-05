package mysql

import (
	"fmt"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
)

type User struct {
	Id   int
	Name string `orm:"size(100)"`
}

func init() {
	// orm.RegisterDataBase("default", "mysql", "root:root@tcp(192.168.224.128:3306)/cloudta?charset=utf8")

	dbhost := beego.AppConfig.String("dbhost")
	dbport := beego.AppConfig.String("dbport")
	dbuser := beego.AppConfig.String("dbuser")
	dbpassword := beego.AppConfig.String("dbpassword")
	db := beego.AppConfig.String("db")

	//注册mysql Driver
	orm.RegisterDriver("mysql", orm.DRMySQL )
	//构造conn连接,
	conn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8", dbuser, dbpassword, dbhost, dbport, db)
	//注册数据库连接，最大空闲连接：30，最大数据库连接：30
	orm.RegisterDataBase("default", "mysql", conn, 30, 30)
	orm.RegisterModel(new(User))

	// 自动建表force：drop table 后再建表， verbose ：打印执行过程
	orm.RunSyncdb("default", false, true)
	orm.Debug = true

	fmt.Printf("数据库连接成功！%s\n", conn)
}

//增加数据
func InsertUser() {
	o := orm.NewOrm()
	user := User{Name: "slene"}
	id, err := o.Insert(&user)
	fmt.Printf("ID: %d, ERR: %v\n", id, err)
}

//删除数据
func RemoveUser(u User) {
	o := orm.NewOrm()
	num, err2 := o.Delete(&u)
	fmt.Printf("NUM: %d, ERR: %v\n", num, err2)
}

//读取数据
func ReadUser(user_id int) {
	o := orm.NewOrm()
	u := User{Id: user_id}
	err1 := o.Read(&u)
	fmt.Printf("ERR: %v\n", err1)
}

//读取数据
func UpdateUser(user_id int, user_name string) {
	o := orm.NewOrm()

	user := User{Id: user_id, Name:user_name}
	num, err6 := o.Update(&user)
	fmt.Printf("NUM: %d, ERR: %v\n", num, err6)
}

func QueryUsers(){
	var users []*User
	orm.NewOrm().QueryTable("user").Filter("User", 1).RelatedSel().All(&users)
	for _, v := range users {
		fmt.Println(v.Id)
	}

	var user User
	err := orm.NewOrm().QueryTable("user").Filter("Name", "张三").Limit(1).One(&user)
	if err == nil {
		fmt.Println(user)
	}
}


