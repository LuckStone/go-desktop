package etcd

import (
	"strings"
)

var Etcdv3Client *Etcdv3
var etcdEndPoints []string

func InitDB(endpoints string) error {
	ends := strings.Split(endpoints, ",")
	Etcdv3Client = &Etcdv3{}

	etcdEndPoints = ends
	err := Etcdv3Client.InitByEndpoints(etcdEndPoints)
	return err
}

func DBReconnect() error {
	if Etcdv3Client != nil {
		Etcdv3Client.Release()
	}

	Etcdv3Client = &Etcdv3{}
	err := Etcdv3Client.InitByEndpoints(etcdEndPoints)
	return err
}

type TreeNode struct {
	ParentKey    string `json:"parent_key"`
	Leaf          bool   `json:"leaf"`
	Cls           string `json:"cls"`
	Text          string `json:"text"`
	Id            string `json:"id"`
	Title        string `json:"qtitle"`
	Tip          string `json:"qtip"`
	CreatedIndex  int64 `json:"createdIndex,omitempty"`
	ModifiedIndex int64 `json:"modifiedIndex,omitempty"`
}

type Result struct{
	Content    interface{} `json:"content"`
	ErrorCode  int `json:"error_code"`
	Message    string `json:"message"`
}

