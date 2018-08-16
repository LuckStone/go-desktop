项目编译步骤：

1、 安装SenchaSDKTools-2.0.0-beta3-windows.exe
2、 执行CreateProject.bat，创建jsb3文件
3、 执行Build.bat，创建压缩包
4、 执行compress.bat 压缩js文件

直接生成的js文件会报错，需要手动写入下面这行代码
Ext.namespace('Plugins', 'Plugins.ad');