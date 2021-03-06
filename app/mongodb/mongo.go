package mongodb

import (
	"gopkg.in/mgo.v2"
	"fmt"

	"gopkg.in/mgo.v2/bson"
)

const url  = "mongodb://123.207.215.205:27017";

func init(){
	url := "mongodb://admin:XXXYYYZZZ@192.168.1.101:9214,admin:XXXYYYZZZ@192.168.1.102:9214,admin:XXXYYYZZZ@192.168.1.103:9214"
	session, _ := mgo.Dial(url)
	session.SetMode(2,false)
	session.SetPoolLimit(20)
}

type Operater struct {
	mogSession *mgo.Session
	dbname string
	document string
}

type person struct {
	AGE    int  `bson:"age"`
	NAME   string `bson:"name"`
	HEIGHT int    `bson:"height"`
}

//func test() {
//	session, err := mgo.Dial("server1.example.com,server2.example.com")
//	if err != nil {
//		panic(err)
//	}
//	defer session.Close()
//
//	// Optional. Switch the session to a monotonic behavior.
//	session.SetMode(mgo.Monotonic, true)
//
//	c := session.DB("test").C("people")
//	err = c.Insert(&Person{"Ale", "+55 53 8116 9639"},
//		&Person{"Cla", "+55 53 8402 8510"})
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	result := person{}
//	err = c.Find(bson.M{"name": "Ale"}).One(&result)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	fmt.Println("Phone:", result.Phone)
//}

func main() {
	mgo.SetDebug(true)
	//mgo.SetLogger()
	mgo.SetStats(true)
	op:=new(Operater)
	op.dbname="mytest"
	op.document="people"
	err:=op.connect()
	if err !=nil {
		fmt.Println("连接出错",err)
		return
	}

	p:=person{
		33,
		"周杰伦",
		175,
	}
	err=op.insert(p)
	if err != nil {
		fmt.Println("插入出错",err)
	}
	op.update()
	op.query();

	count,err:=op.count()
	if err !=nil {
		fmt.Println("统计出错",err)
		return
	}

	err=op.delete(&bson.M{"height": 0})
	if err!=nil {
		fmt.Println("删除错误",err)
	}else{
		fmt.Println("删除成功")
	}

	fmt.Println("共有数据",count)
	op.mogSession.Close()
}
//连接数据库
func (operater *Operater) connect() error {
	mogsession, err := mgo.Dial(url)
	if err != nil {
		fmt.Println(err)
		return err
	}
	operater.mogSession=mogsession
	return nil
}
//插入
func (operater *Operater) insert( p person) error {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	err:=collcetion.Insert(p)
	return err
}
//查询所有
func (operater *Operater) queryAll() ([]person,error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	p:=new(person)
	p.AGE=33
	query:=collcetion.Find(nil)
	ps:=[]person{}
	query.All(&ps)
	iter:=collcetion.Find(nil).Iter()
	//
	result:=new(person)
	for iter.Next(&result) {
		fmt.Println("一个一个输出：", result)
	}
	return ps,nil
}
//条件查询
func (operater *Operater) query() ([]person,error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	p:=new(person)
	p.AGE=33
	query:=collcetion.Find(bson.M{"age":bson.M{"$eq":21}})
	ps:=[]person{}
	query.All(&ps)
	fmt.Println(ps)
	return ps,nil
}

//更新一行
func (operater *Operater) update() (error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	update:=person{
		33,
		"詹姆斯",
		201,
	}
	err:=collcetion.Update(bson.M{"name": "周杰伦"},update)
	if err !=nil {
		fmt.Println(err)
	}
	return err
}
//更新所有数据
func (operater *Operater) updateAll() (error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	update:=person{
		33,
		"詹姆斯",
		201,
	}
	changeinfo,err:=collcetion.UpdateAll(bson.M{"name": "周杰伦"},update)
	if err !=nil {
		fmt.Println(err)
	}
	fmt.Println("共有多少行",changeinfo.Matched,"影响")
	return nil
}


//单行删除
func (operater *Operater) delete(seletor interface{}) (error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	return collcetion.Remove(seletor)
}

//统计文档中数据的个数
func (operater *Operater) count() (int,error) {
	collcetion:=operater.mogSession.DB(operater.dbname).C(operater.document)
	i,err:=collcetion.Count()
	return i,err
}


