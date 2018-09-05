package mysql

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)


//增加数据
func insert() {
	db, err := sql.Open("mysql", "root:root@/golang?charset=utf8")
	checkErr(err)

	stmt, err := db.Prepare(`INSERT user (userid,username,userage,usersex) values (?,?,?,?)`)
	checkErr(err)
	res, err := stmt.Exec(1, "Mary", 20, 1)
	checkErr(err)
	id, err := res.LastInsertId()
	checkErr(err)
	fmt.Println(id)
}

//删除数据
func remove() {
	db, err := sql.Open("mysql", "root:root@/golang?charset=utf8")
	checkErr(err)

	stmt, err := db.Prepare(`DELETE FROM user WHERE userid=?`)
	checkErr(err)
	res, err := stmt.Exec(1)
	checkErr(err)
	num, err := res.RowsAffected()
	checkErr(err)
	fmt.Println(num)
}

//更新数据
func update() {
	db, err := sql.Open("mysql", "root:root@/golang?charset=utf8")
	checkErr(err)

	stmt, err := db.Prepare(`UPDATE user SET userage=?,usersex=? WHERE userid=?`)
	checkErr(err)
	res, err := stmt.Exec(21, 2, 2)
	checkErr(err)
	num, err := res.RowsAffected()
	checkErr(err)
	fmt.Println(num)
}

//查询数据
func query() {
	db, err := sql.Open("mysql", "root:root@/golang?charset=utf8")
	checkErr(err)

	rows, err := db.Query("SELECT * FROM user")
	checkErr(err)

	//    //普通demo
	for rows.Next() {
		var userid int
		var username string
		var userage int
		var usersex int

		rows.Columns()
		err = rows.Scan(&userid, &username, &userage, &usersex)
		checkErr(err)

		fmt.Println(userid)
		fmt.Println(username)
		fmt.Println(userage)
		fmt.Println(usersex)
	}
}
func checkErr(err error) {
	if err != nil {
		panic(err)
	}

}