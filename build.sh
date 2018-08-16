#!/bin/bash
echo "In build.sh"
set -e

src_root=`pwd`
dir_name=${src_root##*/}

echo "src root:" ${src_root}
echo "dir name:" ${dir_name}

mkdir -p ${GOPATH}/src

ln -s ${src_root} ${GOPATH}/src/desktop

cd ${GOPATH}/src/desktop

echo "change to" `pwd`

echo "CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -tags netgo -installsuffix cgo -o go-desktop"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -tags netgo -installsuffix cgo -o go-desktop
echo "end of build.sh"
