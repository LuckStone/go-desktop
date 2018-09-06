package mysql

import (
	"time"
	"github.com/astaxie/beego/orm"
	"desktop/app/ecode"
	"fmt"
	"desktop/app/util"
)

type Group struct {
	Id    int          `orm:"pk"` // 唯一, 索引
	Name  string       `orm:"unique;size(60)"` // 唯一
	Email string       `orm:"null;size(60)"` // ALLOW NULL,默认NOT NULL
	Desc string        `orm:"null;size(200)"` // 默认为 varchar(255)
	Remark string        `orm:"column(group_remark)"` // db 字段的名称
	AnyField string    `orm:"-"`  // 可忽略的字段
	Money float64      `orm:"digits(12);decimals(4)"` // 总长度 12 小数点后 4 位 eg: 99999999.9999

	// 为字段设置默认值，类型必须符合（目前仅用于级联删除时的默认值）
	Status int `orm:"default(1)"`

	// auto_now_add,auto_now 对于批量的 update 此设置是不生效的
	Created time.Time `orm:"auto_now_add;type(datetime)"`  // auto_now_add 第一次保存时才设置时间
	Updated time.Time `orm:"auto_now;type(datetime)"`  // auto_now 每次 model 保存时都会对时间自动更新
}

func (g *Group) TableName() string {
	return "group"
}

// 多字段索引
func (u *Group) TableIndex() [][]string {
	return [][]string{
		[]string{"Id", "Name"},
	}
}

// 多字段唯一键
func (u *Group) TableUnique() [][]string {
	return [][]string{
		[]string{"Name", "Email"},
	}
}

// 设置引擎为 INNODB
func (u *Group) TableEngine() string {
	return "INNODB"
}

// ListGroups
func ListGroups() ([]*Group, error) {
	var groups []*Group
	orm.NewOrm().QueryTable("group").RelatedSel().All(&groups)

	return groups, nil
}

// GetGroup
func GetGroup(groupID int) (*Group, error) {
	group := Group{Id: groupID}
	if err := orm.NewOrm().Read(&group); err != nil {
		util.Error(fmt.Sprintf("GetGroup [%s] fail: %v", groupID, err))
		return nil, ecode.NewError(ecode.EcodeParameterError, fmt.Sprintf("GetGroup [%s] fail: %v", groupID, err))
	}
	return &group, nil
}

//增加数据
func AddGroup(group Group) (int64, error){
	id, err := orm.NewOrm().Insert(&group)
	if err != nil {
		util.Error(fmt.Sprintf("AddGroup [%v] fail: %v", group, err))
		return 0, ecode.NewError(ecode.EcodeParameterError, fmt.Sprintf("GetGroup [%v] fail: %v", group, err))
	}
	return id, nil
}

// PutGroup
func PutGroup(group *Group) error {
	if _, err := orm.NewOrm().Update(&group); err != nil {
		util.Error(fmt.Sprintf("PutGroup [%v] fail: %v", group, err))
		return ecode.NewError(ecode.EcodeParameterError, fmt.Sprintf("GetGroup [%v] fail: %v", group, err))
	}
	return nil
}

// DeleteGroup
func DeleteGroup(groupID int) error {
	group := Group{Id:groupID}
	if _, err := orm.NewOrm().Delete(&group); err != nil {
		util.Error(fmt.Sprintf("DeleteGroup [%s] fail: %v", groupID, err))
		return ecode.NewError(ecode.EcodeParameterError, fmt.Sprintf("DeleteGroup [%s] fail: %v", groupID, err))
	}
	return nil
}

