package etcd

import (
	"github.com/coreos/etcd/clientv3"
	"time"
	"fmt"
	"golang.org/x/net/context"
	"strings"
	"github.com/astaxie/beego"
)

type Etcdv3 struct {
	client *clientv3.Client
	ctx    context.Context
}

func (le *Etcdv3) Init(IPs []string) error {
	endpoints := make([]string, 0, 4)
	for i := range IPs{
		endpoints = append(endpoints, fmt.Sprintf("http://%s:%d", IPs[i], 2379))
	}

	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   endpoints,
		DialTimeout: 5 * time.Second, // time out
	})
	if err != nil {
		// handle error!
		return err
	}
	if cli == nil {
		return fmt.Errorf("can't init etcd client v3")
	}
	le.client = cli
	le.ctx    = context.Background()
	return nil
}

func (le *Etcdv3) InitByEndpoints(endpoints []string) error {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   endpoints,
		DialTimeout: 5 * time.Second, // time out
	})
	if err != nil {
		// handle error!
		return err
	}
	if cli == nil {
		return fmt.Errorf("can't init etcd client v3")
	}
	le.client = cli
	le.ctx    = context.Background()
	return nil
}

func (le *Etcdv3) Release(){
	if le != nil && le.client != nil {
		le.client.Close()
	}
}

func (le *Etcdv3) GetIpByName(name string) string {
	if le == nil || le.client == nil {
		return ""
	}

	membersResp, err := le.client.MemberList(le.ctx)
	if err != nil {
		return ""
	}
	for _, member := range membersResp.Members {
		if member.Name != name {
			continue
		}
		for i := range member.ClientURLs {
			points := member.ClientURLs[i]
			points  = points[7:] // 去掉 http://
			ipAndport := strings.Split(points, ":")
			if len(ipAndport) >= 2 {
				// TODO 可能需要检查是否符合IP格式，防止意料外的错误
				return ipAndport[0]
			}
		}
	}

	return ""
}

func (le *Etcdv3) GetTreeList(key string, opt ...clientv3.OpOption) ([]TreeNode, error) {
	if le == nil || le.client == nil {
		return nil, fmt.Errorf("etcd: should init first")
	}

	arr := make([]TreeNode, 0)
	length := len(key)
	if length != 1{
		length += 1
	}

	keys := make(map[string]string, 0)

	gr, err := le.client.Get(le.ctx, key, clientv3.WithPrefix())
	if err != nil {
		beego.Error("Get data from etcd fail,as:", err)
		return arr, err
	}
	if gr == nil {
		return arr, fmt.Errorf("read data[%s] from etcd return nil", key)
	}
	for _,item := range gr.Kvs {
		if key != string(item.Key) && item.Key[length-1] != '/'{
			continue
		}
		_id := ""
		index := strings.Index(string(item.Key[length:]), "/")
		if index > 0 {
			_id = string(item.Key[0: length +index])
		}else{
			_id = string(item.Key)
		}

		_, ok := keys[_id]
		if ok{
			continue
		}
		keys[_id] = ""

		node := TreeNode{}
		node.CreatedIndex = item.CreateRevision
		node.ModifiedIndex = item.ModRevision
		node.ParentKey = key
		node.Title = "read"
		node.Id = _id


		if index >= 0 {
			node.Tip = ""
			node.Leaf = false
			node.Cls = "folder"
			node.Text = string(item.Key[length:length + index])
		}else{
			node.Tip = string(item.Value)
			node.Leaf = true
			node.Cls = "file"
			node.Text = string(item.Key[length:])
		}
		arr = append(arr, node)
		if len(arr) > 100{
			break
		}
	}

	return arr, err
}

func (le *Etcdv3) Get(key string) (map[string]string, error) {
	if le == nil || le.client == nil {
		return nil, fmt.Errorf("etcd: should init first")
	}

	result := make(map[string]string)

	gr, err := le.client.Get(le.ctx, key)
	if err == nil {
		if gr != nil {
			for i := range gr.Kvs {
				result[string(gr.Kvs[i].Key)] = string(gr.Kvs[i].Value)
			}
		}
	}

	// get the key and follow
	suffix := ""
	newKey := ""
	if len(key) >= 2 { // maybe this is no need, because launcher's key length more than 2 characters
		suffix = key[len(key) - 2:len(key) - 1]
	} else {
		return result, err
	}
	if suffix != "/" {
		newKey = key + "/"
	}else{
		newKey = key
	}

	gr, err = le.client.Get(le.ctx, newKey, clientv3.WithPrefix())
	if err == nil {
		if gr != nil {
			for i := range gr.Kvs {
				result[string(gr.Kvs[i].Key)] = string(gr.Kvs[i].Value)
			}
		}
	}

	return result, err
}

func (le *Etcdv3) Put(key, value string) error {
	if le == nil || le.client == nil {
		return fmt.Errorf("etcd: should init first")
	}

	// if already exist, just return
	// read more, write less for speed up
	gr, err := le.client.Get(le.ctx, key)
	if err == nil {
		if gr != nil {
			for i := range gr.Kvs {
				if i%2 == 0 {
					continue
				}
				if strings.Compare(string(gr.Kvs[i].Value), value) == 0 {
					// already set, just return
					return nil
				}
			}
		}
	}

	_, err = le.client.Put(le.ctx, key, value)
	return err
}

func (le *Etcdv3) Delete(key string) error {
	if le == nil || le.client == nil {
		return fmt.Errorf("etcd: should init first")
	}

	// delete the key
	_, err1 := le.client.Delete(le.ctx, key)

	// delete the key and follow
	suffix := ""
	newKey := ""
	if len(key) >= 2 { // maybe this is no need, because launcher's key length more than 2 characters
		suffix = key[len(key) - 2:len(key) - 1]
	} else {
		return err1
	}
	if suffix != "/" {
		newKey = key + "/"
	}else{
		newKey = key
	}

	_, err2 := le.client.Delete(le.ctx, newKey, clientv3.WithPrefix())
	if err1 != nil || err2 != nil {
		err := fmt.Errorf("%v %v", err1, err2)
		return err
	}
	return nil
}

func (le *Etcdv3) IsKey(key string) (bool, error) {
	if le == nil {
		return false, fmt.Errorf("etcd: should init first")
	}

	values, err := le.Get(key)
	if err != nil {
		return false, err
	}

	if values != nil && (len(values) >= 1) {
		return true, nil
	}

	return false, nil
}