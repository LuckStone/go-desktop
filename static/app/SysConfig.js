Ext.namespace('Plugins', 'Plugins.NetWork');

Ext.define('MyDesktop.SysConfig', {
    extend: 'Ext.window.Window'
	,uses:['Ext.ux.desktop.Scheme','Plugins.NetWork.Configure','Ext.ux.desktop.FormPanel']
	,layout: 'fit'
    ,title: 'System Configure'
    ,modal: true
    ,width: 640
    ,height: 480
    ,border: false
	,id:Ext.id()
	,constructor: function (config) {
		Ext.apply(this, config);
		this.schema = Plugins.NetWork.Configure({});
		this.schema.defineModel('RegisterServer');
		this.callParent();
    }
	,initComponent:function(){
		this.init();
		this.callParent(arguments);
	}
	,init:function(){
		var me = this;
		var form_id = me.id + "_" + me.schema.ns;
		var cfg = {
			'schema':me.schema
			,id:form_id
			,btns:[{
				text:'注册'
				,disabled: true
				,formBind: true
				,handler:function(btn){
					var f = btn.up('form').getForm();
					if(f.isValid()){
						var record = f.getRecord();
						f.updateRecord(record);
						var operation = new Ext.data.Operation({
							action: 'post'
							,writer:'json'
							,params:record.getData()
						});
						var callback = function(){
							arr = arguments;
						}
						/*proxy = new Ext.ux.desktop.AjaxProxy(schema.ns,'RegisterServer',[]);*/
						record.proxy.create(operation,callback,this);
					}
				}
			}]
		};
		me.form_id = form_id;
		me.items = [new Ext.ux.desktop.FormPanel(cfg)];
	}
	,listeners:{
		'show':function(win){
			var model = Ext.ModelManager.getModel(win.schema.ns);
			model.load('ServerInfo', {
				failure: function(record, operation) {
					console.log('Fail'); 
				},
				success: function(record, operation) {
					var formComp = Ext.getCmp(win.form_id);
					formComp.loadRecord(record);
				}
			});
			
		}
	}
});