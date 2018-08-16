Ext.define('Ext.ux.desktop.ConfigPanel', {
	extend: 'Ext.form.Panel'
	,requires: ['Ext.data.reader.Json']
	,frame: true
	,layout: 'form'
	,bodyPadding: '15 15 0 15'
	,waitMsgTarget: true
	,reader : null
	,items:[]
	,identityValue:null
	,url:''
	,modelName:''
	,fieldDefaults: {
		labelAlign: 'right'
		,labelWidth: 150
		,msgTarget: 'side'
	}
	,defaultType: 'textfield'
	,constructor: function (config) {
		Ext.apply(this, config);
		this.callParent();
    }
	,initComponent:function(){
		this.init();
		this.initButtons();
		this.callParent(arguments);
	}
	,listeners:{
		'show':function(win){
			var me = this;
			me.model.load(me.identityValue, {
				failure: function(record, operation) {
					console.log('Fail'); 
				},
				success: function(record, operation) {
					if(typeof record.format == 'function'){
						record.format();
					}
					me.loadRecord(record);
				}
			});
		}
	}
	,init:function(){
		var me = this;
		me.model = Ext.ModelManager.getModel(me.modelName);
		me.reader = new Ext.data.reader.Json({
			model: me.modelName
		});
	}
	,initButtons:function(){
		var me = this;
		if(me.btns && me.btns instanceof Array){
			me.buttons = me.buttons.concat(me.btns);		
		}
	}
	,fetchRemoteData:function(){
		var me =this;
		me.getForm().load({
			url: me.url + me.identityValue,
			waitMsg: 'Loading...'
		});
	}
	,focusField:function(fldname){
		var f = this.getForm().findField(fldname);
		if(f)f.focus(false,true);
	}
	,buttons: [{
		text: '保存',
		disabled: true,
		formBind: true,
		handler: function(){
			var form = this.up('form').getForm();
			if (form.isValid()) {
				form.submit({
					submitEmptyText: false
					,timeout:30
					,reset:false
					,waitMsg: 'Saving Data...'
					,waitTitle: 'Saving Data...'
					,success: function(form, action) {
					   Ext.Msg.alert('Success', action.result.message);
					}
					,failure: function(form, action) {
						Ext.Msg.alert('Failed', action.result ? action.result.message : 'No response');
					}
				});
			}
		}
	}]
});