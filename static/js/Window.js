Ext.define('Ext.ux.desktop.Window', {
	extend: 'Ext.ux.desktop.Module'
    ,requires: [
		'Ext.grid.*'
		,'Ext.data.Model'
		,'Ext.data.Store'
		,'Ext.data.JsonReader'
		,'Ext.util.*'
		,'Ext.toolbar.Paging'
		,'Ext.ux.PreviewPlugin'
		,'Ext.ModelManager'
		,'Ext.tip.QuickTipManager'
		,'Ext.ux.desktop.AjaxProxy'
		,'Ext.selection.CheckboxModel'
		,'Ext.ux.desktop.Scheme'
		,'Ext.ux.desktop.PageGridPanel'
    ]
	,uniqueKey : ''
	,publicAction:true
	,allowSystemMgr:true
	,currentNode:{}
	,currentGridID:'Grid'
	,constructor: function () {
		this.uniqueKey = Ext.id();
		this.callParent(arguments);
    }
    ,init : function(){
        this.launcher = {
            text: 'Window',
            iconCls:'icon-grid'
        };
    }
	,getCmpId:function(type){
		return this.uniqueKey + type;
	}
	,getCmp:function(type){
		return Ext.getCmp(this.getCmpId(type));
	}
    ,createWindow : function(){
		var me = this;
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow(me.id);
        if(!win){
			var cfg = me.getWinConfig();
			Ext.applyIf(cfg,{
				id:me.id
				,title:'Window'
				,width:800
				,height:600
				,iconCls:'icon-grid'
				,animCollapse:false
				,constrainHeader:true
				,layout: 'fit'
			});
            win = desktop.createWindow(cfg);
        }
        return win;
    }
	,getToolbarCfg: function(){
		var _instance = this;
		var toolbar = [{
					text:' <span style="font-weight:600; color:#0066FF; font-size:12px;">操作</span>'
				}]
		return toolbar;
	}
	,nodeDblclickfn: function(node){		
	}
	,getCurrentNodeID:function(){
		return this.currentNode.current;
	}
	,getCurrentNode:function(){
		return this.currentNode;
	}
	,setCurrentNode:function(obj){
		this.currentNode = {};
		Ext.apply(this.currentNode,obj);
	}
	,getSelectedRow:function(key){
		var _instance = this;
		var grid = _instance.getCmp("SysKernel.M.baseRecord",_instance.uniqueKey+'grid');

		var rowData = grid.getSelected();
		var value = rowData ? rowData.get(key): "";
		return value;
	}
	,getSelectedRows:function(){
		var _instance = this;
		var grid = _instance.getCmp("SysKernel.M.baseRecord",_instance.uniqueKey+'grid');
		var rowData = grid.getSelections();
		var result = [];
		for(var d in rowData){
			var obj = rowData[d].json;
			if(obj)	result.push(obj)
		}
		return result;
	}
	,reloadTreeNode:function(module){
		var _instance = module;	
		var cid = _instance.getCurrentNodeID();
		cid = cid ? cid :'0'; 		
		var tree = Ext.getCmp(_instance.uniqueKey+'treePanel');
		var loader = tree.getLoader();
		var node = tree.getNodeById(_instance.getCurrentNodeID());
		loader.load(node,function(){node.expand(false,false, Ext.emptyFn )});
	
	}
	,reloadGridData:function(node){
		var me = this;
		var gridID = me.getCurrentGridID(node);
		if (gridID){
			var cmp = me.getCmp(gridID);
			cmp.reloadData(node);
		}		
	}
	,getCurrentGridID:function(node){
		if(node && node.qtitle){
			return node.qtitle + "Grid";
		}
		return this.currentGridID;
	}
});
