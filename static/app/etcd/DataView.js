Ext.namespace('Plugins', 'Plugins.etcd');


Ext.define('MyDesktop.etcd.DataView', {
    extend: 'Ext.ux.desktop.Window'
    ,requires: [
		'Plugins.etcd.Node'
		,'Ext.ux.desktop.TreePanel'
		
    ]
	,id:'DataView-win'
	,currentGridID:'IPInfoGrid'
	,getWinConfig:function(){
		var instance = this;
		return {
			title:'ETCD'
			,width:ENV.width
			,height:ENV.height
			,layout:"border"
			,bodyBorder:true
			,border:true
			,bufferResize:true
			,defaults:{
				margins:'0 0 0 0'
				,layout:'fit'
				,bodyBorder:false
				,border:true
				,split:true
			}
			,items:[{
					region:'west'
					,width: 300
					,minSize: 175
					,maxSize: 600
					,items: [
						Ext.create('Ext.ux.desktop.TreePanel',{
							schema:Plugins.etcd.Node({})
							,title: '目录树'
							,wct:instance
						})
					]
				},{
					region:'center'
					,items: [{
						xtype: 'textarea',
						//xtype: 'htmleditor',
						id: 'notepad-editor',
						value: ''
					}]
				}
			]
			,tbar:[{
				text:' <span class="winTitle">请在左边双击您要修改的节点!!</span>'
				,id: instance.getCmpId('label')
				,handler:function(){
					alert("如果您有疑问,请询问系统管理员!!")
				}
			}]
		};
	}
});


