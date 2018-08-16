/*
{
	label:"自动编号"
	,xtype:textfield
	,flex:1
	,sortable:true
	,width:100
	,hidden:true
	,emptyText:''
	,type:"int"
	,validations:[]
}
*/


Ext.define('Ext.ux.desktop.Scheme', {
	requires: ['Ext.data.Model']
	,identity:'_id'
	,description : ''
	,ns:''
	,titleField:''
	,validations:[]
	,fields:[]
	,showField:[]
	,formField:[]
	,constructor: function (config) {
		Ext.apply(this, config.Meta || {});
		this.validations = [];
		this.fields = [];
		this.showField = [];
		this.formField = [];
		this.parseConfig(config);
	}
	,parseConfig:function(config){
		var me = this;		
		var Column = function(key,cfg){
			var item = {
				text: cfg.label || "Title"
				,dataIndex: key
				,flex: cfg.flex || 1
				,width: cfg.width || 100
				,hidden: cfg.hidden || false
				,sortable: cfg.sortable || false
			};
			if(cfg.renderer){
				item.renderer = cfg.renderer;
			}			
			return item;
		};
		
		var Field = function(key,cfg){
			item = {
				name: key
				,xtype: cfg.xtype || "textfield"
				,fieldLabel: cfg.label || "fieldLabel"
			};
			if(cfg.formConfig){
				Ext.apply(item,cfg.formConfig);
			}
			return item;
		}

		for(var key in config){
			if(key == 'Meta') continue;
			var item = config[key];
			me.fields.push({'name':key,'type':item.type});
			if (item.validations && item.validations instanceof Array){
				me.validations.concat(item.validations );
			}
			
			if (!item.hidden){
				me.showField.push(Column(key,item));
			}

			me.formField.push(Field(key,item));
		}
	}
	,defineModel:function(act){
		act = act || "";
		var me = this;
		if(Ext.ModelManager.getModel(me.ns)){
			return;
		}
		Ext.define(me.ns, {
			extend: 'Ext.data.Model'
			,fields: me.fields
			,idProperty: me.identity
			,validations: me.validations
			,changeName: function() {
				var oldName = this.get('name'),
					newName = oldName + " The Barbarian";

				this.set('name', newName);
			}
			,proxy: new Ext.ux.desktop.AjaxProxy(me.ns,act,[])
		}); 
	}
	,getShowField:function(){
		return this.showField;
	}
	,getFormField:function(){
		return this.formField;
	}
	
 });