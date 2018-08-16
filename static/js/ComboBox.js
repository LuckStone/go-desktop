/*
,citys:{
	label:"区域范围"
	,type:"string"
	,xtype:"schemacombo"
	,sortable:true
	,width:100
	,flex:1
	,validations:[]
	,formConfig:{
		valueField:'_id'
		,displayField:'name'
		,ajaxParams:{'parent_id':100000}
		,schema:Plugins.ad.Region({})
		,emptyText:'请选择区域范围'
	}
}
*/


Ext.define('Ext.ux.desktop.ComboBox', {
	extend: 'Ext.form.field.ComboBox'
	,requires: ['Ext.data.Model','Ext.ux.desktop.AjaxProxy']
	,xtype: 'schemacombo'
	,fieldLabel:'fieldLabel'
	,name:'name'
	,valueField:'_id'
	,displayField:'displayField'
	,typeAhead:true
	,emptyText:'Select a item'
	,editable : true
	,ajaxParams:{}
    ,constructor: function (config) {
		Ext.apply(this, config);
		this.callParent();
    }
	,initComponent:function(){
		this.initStore();
		this.callParent(arguments);
	}
	,onRender:function(ct, position){
		this.callParent(arguments);
	}	
	,initStore : function(){
		var me = this;
		me.schema.defineModel();
		me.columns = me.schema.getShowField();
		
		this.store = Ext.create('Ext.data.Store', {
			pageSize: me.pageSize
			,model:me.schema.ns
			,remoteSort: true
			,remoteFilter:true
			,proxy: new Ext.ux.desktop.AjaxProxy(me.schema.ns,'List',[])
			,sorters: [{
				property: me.schema.identity,
				direction: 'DESC'
			}]
			,autoLoad:true  // 第一次加载的时候就load数据
			,listeners:{
				'beforeload':function(store, operation, eOpts ){
					store.filters.clear();
					for (key in me.ajaxParams){
						var value = me.ajaxParams[key];
						if(value.isDynParam){
							value = value.getValue();
						}
						var filter = new Ext.util.Filter({
							property: key,
							value   : value
						});
						store.filters.items.push(filter);
					}
				}
			}
		});
		
	}
});