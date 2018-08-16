Ext.define('Ext.ux.desktop.FormPanel', {
	extend: 'Ext.form.Panel'
	,requires: ['Ext.data.reader.Json']
	,frame: true
	,layout: 'form'
	,bodyPadding: '15 15 0 15'
	,waitMsgTarget: true
	,reader : null
	,items:[]
	,identityValue:null
	,fieldDefaults: {
		labelAlign: 'right'
		,labelWidth: 85
		,msgTarget: 'side'
	}
	,defaultType: 'textfield'
	,constructor: function (config) {
		Ext.apply(this, config);
		this.callParent();
    }
	,initComponent:function(){
		this.init();
		this.initButtons()
		this.callParent(arguments);
	}
	,init:function(){
		var me = this;
		me.items = me.schema.getFormField();
		me.model = Ext.ModelManager.getModel(me.schema.ns);
		me.reader = new Ext.data.reader.Json({
			model: me.schema.ns
		})
		me.url = 'console/' + me.schema.ns
	}
	,initButtons:function(){
		var me = this;
		if(me.btns && me.btns instanceof Array){
			me.buttons = me.buttons.concat(me.btns);
		}		
	}
	,fetchData:function(){
		var me = this;
		if (me.identityValue){
			me.fetchRemoteData();
		}
		else{
			me.fetchGridData();
		}
	}
	,fetchGridData:function(){
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
			var f = this.up('form').getForm();
			if(f.isValid()){
				var record = f.getRecord();
				f.updateRecord(record);
				record.save({
					params:record.getData()
					,waitMsg: 'Saving Data...'
					,waitTitle: 'Saving Data...'
					,submitEmptyText: true
					,timeout:30
					,success: function(form, action) {
						Ext.Msg.alert('Success', action.resultSet.message);
					}
					,failure: function(form, action) {
						record.destroy();
						Ext.Msg.alert('Failed', action.resultSet ? action.resultSet.message : 'No response');
					}
				});
			}
		}
	}
	/*,{
		text: '保存',
		handler: function(){
			formPanel.getForm().load({
				url: 'xml-form-data.xml',
				waitMsg: 'Loading...'
			});
		}
	}*/]
});



Ext.define('Ext.ux.desktop.Window4Grid', {
	extend: 'Ext.window.Window'
	,requires: []
	,layout: 'fit'
	,items:[]
	,constructor: function (config) {
		Ext.apply(this, config);
		this.callParent();
    }
	,initComponent:function(){
		this.init();
		this.callParent(arguments);
	}
	,init:function(){
		var me = this;
		var cfg = {'schema':me.schema,'identityValue':me.identityValue,'id':me.formId};
		me.items = [new Ext.ux.desktop.FormPanel(cfg)];
	}
	,dialogOnShow:function(win){
		var formComp = this.getSchemaForm();
		if(formComp != null){						
			var resetData = win.resetObj;
			if(typeof win.resetObj == 'function') resetData = win.resetObj.call(this);
			if(!Ext.isEmpty(resetData)){
				formComp.form.reset();
				formComp.setJson(resetData);
			}
			formComp.form.clearInvalid();
			if(!Ext.isEmpty(win.focusField,true))
				formComp.focusField(win.focusField);
		}
	}
	,getSchemaForm : function(){
		var formCmp = this.appPanel.getCmp(this.schema,'frm4' + this.dlgkey);
		return formCmp;
	}
});



Ext.define('Ext.ux.desktop.PageGridPanel', {
	extend: 'Ext.grid.Panel'
	,requires: ['Ext.data.Model','Ext.ux.desktop.AjaxProxy','Ext.PagingToolbar','Ext.data.Operation']
	,xtype: 'pagegrid'
	,guid:''
    ,constructor: function (config) {
		this.guid = Ext.id();
		Ext.apply(this, config);
		this.callParent();
    }
	,schema:null
	,singleSelect:true
	,pageSize:15
	,ajaxParams:[]
	,columns:[]
	,tbar:[]
	,hidePager:false
	,hidePagerOnePage:true
	,restoreScroll:true
	,noAutoLoad:false
	,initComponent:function(){
		this.initStore();
		this.initToolbar();
		this.callParent(arguments);
	}
	,onRender:function(ct, position){
		this.callParent(arguments);
		
		var grid = this;
		var ds = grid.store;
		
		ds.un("beforeload");
		ds.on("beforeload",function(){ 
			grid.getView().saveScrollState();
		});
		ds.un("load");
		ds.on("load",function(){  
			grid.getView().restoreScrollState();
		});
	}
	,initStore : function(){
		var me = this;
		me.schema.defineModel();
		me.columns = me.schema.getShowField();
		
		var store = Ext.create('Ext.data.Store', {
			pageSize: me.pageSize
			,model:me.schema.ns
			,remoteSort: true
			,remoteFilter:true
			,proxy: new Ext.ux.desktop.AjaxProxy(me.schema.ns,'Page',me.ajaxParams)
			,sorters: [{
				property: me.schema.identity,
				direction: 'DESC'
			}]
			,autoLoad:true
			,listeners:{
				'beforeload':function(store, operation, eOpts ){
					operation.filters = [];
					for(var i=0; i<me.ajaxParams.length; i++){
						var a = me.ajaxParams[i];
						if(a.isDynParam){
							a = a.getValue();
						}
						if(a){
							operation.filters.push(a);
						}
					}
				}
			}
		});
		this.store = store;
		if(me.hidePager)return;		
		this.bbar = Ext.create('Ext.PagingToolbar', {
            store: store,
            displayInfo: true,
            displayMsg: 'Displaying topics {0} - {1} of {2}',
            emptyMsg: "No topics to display",
            items:[
                '-', {
                text: 'Show Preview',
                pressed: true,
                enableToggle: true,
                toggleHandler: function(btn, pressed) {
                    var preview = Ext.getCmp('gv').getPlugin('preview');
                    preview.toggleExpanded(pressed);
                }
            }]
        });
		
	}
	,getCmpId:function(type){
		return this.guid + type + this.schema.ns;
	}
	,getCmp:function(type){
		return Ext.getCmp(this.getCmpId(type));
	}
	,createDialog:function(config){
		var me = this;
		
		var dlgId = me.getCmpId('dlg4' + config.dlgkey);
		if(Ext.getCmp(dlgId)) return Ext.getCmp(dlgId);

		var dlgCfg = me.dlgs[config.dlgkey].call(me);
		Ext.applyIf(dlgCfg,config);
		dlgCfg.listeners = dlgCfg.listeners || {};
		Ext.applyIf(dlgCfg.listeners, config.listeners);
		
		Ext.applyIf(dlgCfg,{
			id:dlgId
			,ownerGrid:me
			,schema:me.schema
		});
		return new Ext.ux.desktop.Window4Grid(dlgCfg);
	}
	,createCustomButton : function(buttonConfig){	
		var thisGrid = this;		
		var result =  Ext.applyIf(buttonConfig,{
			handler:function(){					
				var dlg = thisGrid.createDialog({
					dlgkey:buttonConfig.dlgkey
					,schema:buttonConfig.schema
				});
				dlg.show();
			}	
		});		
		return result;
	}
	,createDefaultButton : function(type){
		var me = this;
		var descript = me.schema.description;
		if(type == 'create'){
			return {
				id: me.getCmpId('btnCreate')
				,text:'增加'
				,tooltip:'增加' + descript
				,iconCls:'add'
				,handler:function(){
					var dlg = me.createDialog({
						dlgkey:"create"
						,title:'增加' + descript
						,noAttachListenSource:true
						,formId:me.getCmpId('frm4create')
						,listeners:{
							'show':function(win){
								var record  = Ext.create(me.schema.ns, {});
								me.store.insert(0,record);
								record.join(me.store);
								var formComp = me.getCmp('frm4create');
								formComp.loadRecord(record);
							}
							,'close':function(panel, eOpts){
								me.store.reload();
							}
							
						}
					});
					dlg.show();
				}
			};
		}
		else if(type == 'delete'){
			return {
				id: me.getCmpId('btnDelete'),
				text:'删除',
				tooltip:'删除' + descript,								
				iconCls:'remove',
				handler:function(){					
					me.deleteRecord(this);
				}
			};
		}
		else if(type == 'modify'){
			return {
				id:me.getCmpId('btnModify'),
				text:'修改',
				tooltip:'修改' + descript,						
				iconCls:'option',
				handler:function(){
					var record = me.getSelectionModel().getLastSelected();
					if(record != null){
						var config = {
							dlgkey:"modify"
							,title:'修改'
							,identityValue:'333'
							,formId:me.getCmpId('frm4modify')
							,noAttachListenSource:true
							,listeners:{
								'show':function(win){
									var formComp = me.getCmp('frm4modify');
									formComp.loadRecord(record);
									formComp.form.clearInvalid();
									formComp.focusField(win.focusField);
								}
							}
						};
						me.createDialog(config).show();
					}
					else{
						Ext.MessageBox.alert('未选择','请选择' + descript);
					}
				}
			};
		}
		else{
			return this.createCustomButton(type);
		}
	}
	,initToolbar:function(){
		var me = this;
		if(Ext.isEmpty(me.tbar)) me.tbar = [];
		if(me.tbars && me.tbars instanceof Array){
			if(Ext.isEmpty(me.schema.ns)){
				alert('schema need ns in grid panel initComponent');
			}
			for(var i=0;i < me.tbars.length; i++){
				if(typeof me.tbars[i] == 'string'){
					me.tbar.push(me.createDefaultButton(me.tbars[i]));
				}
				else{
					if(Ext.isEmpty(me.tbars[i].dlgkey)){
						me.tbar.push(me.tbars[i]);
					}
					else{
						me.tbar.push(me.createCustomButton(me.tbars[i]));
					}
				}
			}
		}	
	}
	,reloadData : function(node){
		var ds = this.store;
		ds.reload();
		this.fireEvent('afterReload');
	}
	/**
	 * 读取选中的记录
	 */
	,getSelected : function(){
		return this.getSelectionModel().getSelected();
	}
	/**
	 * 读取选中的多条记录
	 */
	,getSelections: function(){
		return this.getSelectionModel().getSelections();
	}
	,getIdentityField:function(){
		return ace.core.getIdentityField(this.schema);
	}
	,deleteRecord:function(){
		var me = this;
		var record = me.getSelectionModel().getLastSelected();
		if(record == null){
			var descript = me.schema.description;
			Ext.MessageBox.alert('未选择','请选择' + descript);
		}

		var idProperty = record.idProperty;
		var record_id = record.data[idProperty];
		filters =  [{property: idProperty,value: record_id}];
		
		record.destroy({
			filters:filters
			,success: function() {
				console.log('The record was destroyed!');
			}
		});
	}
});