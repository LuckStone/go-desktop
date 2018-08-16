node {
	sh 'rm -rf *'
	//代码检出
	stage('Check out') {
          git credentialsId: 'ufleet-user-git', url: 'http://192.168.19.250/ufleet/user.git'
    } 
    // 镜像中代码构建
    stage('Build'){
        docker.image('192.168.18.250:5002/ufleet-build/golang:1.8').inside {
            sh './build.sh'
        }
    }
    // 编译镜像并push到仓库
    stage('Image Build And Push'){
        docker.withRegistry('http://192.168.18.250:5002', '18.250-registry-admin') {
            docker.build('192.168.18.250:5002/ufleet/desktop:latest').push()
        }
    }
}