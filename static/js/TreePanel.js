Ext.define('Ext.ux.desktop.TreePanel', {
	extend: 'Ext.tree.Panel'
	,requires: ['Ext.tree.*']
	,xtype: 'desktoptree'
	,guid:''
	,rootVisible: false
	,viewConfig: {
		plugins: {
			ptype: 'treeviewdragdrop',
			containerScroll: true
		}
	}
	,root:{
		text: 'Root',
		id: 'root',
		expanded: true
	}
	,title: 'TreePanel'
	,useArrows: true
	,treeName:''
	/*,dockedItems: [{
		xtype: 'toolbar'
		,items: [{
			text: 'Expand All',
			handler: function(){
				tree.getEl().mask('Expanding tree...');
				var toolbar = this.up('toolbar');
				toolbar.disable();
				
				tree.expandAll(function() {
					tree.getEl().unmask();
					toolbar.enable();
				});
			}
		}, {
			text: 'Collapse All',
			handler: function(){
				var toolbar = this.up('toolbar');
				toolbar.disable();
				
				tree.collapseAll(function() {
					toolbar.enable();
				});
			}
		}]
	}]*/
    ,constructor: function (config) {
		this.guid = Ext.id();
		Ext.apply(this, config);
		this.callParent();
    }
	,initComponent:function(){
		this.initStore();
		this.callParent(arguments);
	}
	,initStore : function(){
		var me = this;
			
		var store = Ext.create('Ext.data.TreeStore', {
			proxy: new Ext.ux.desktop.AjaxProxy(me.schema.ns,'read',me.ajaxParams)
			,root: me.root
			,remoteFilter:true
			,folderSort: true
			,sorters: [{
				property: 'text',
				direction: 'ASC'
			}]
			,listeners:{
				/*'beforeload':function(store, operation, eOpts ){
					if (me.treeName){
						var url = store.proxy.url;
						arr = url.split('/');
						arr[2] = me.treeName;
						url = arr.join('/');
						store.proxy.url = url;
					}
				}*/
			}
		});
		this.store = store;		
	}
	,listeners: {
		'beforeitemexpand':function(node,eOpts){
			var me = this;
			var data = node.getData();
			me.treeName = data.qtitle;
		}
		,'itemdblclick' : function(view, record, item, index, e, eOpts){
			var wct = this.wct;
			e.stopEvent();
			if(wct.publicAction){
				var front = "<span class='winTitle'>当前操作节点是：";
				var behind = "</span>";
				
				var str = "";
				var parent = record;
				var cn = {path:[]}; /*收集当前节点信息*/
				if(wct.allowSystemMgr){
					var node = record.getData();
					cn["current"] = node.id;
					cn["nodeType"] = node.qtitle;
					if(node.leaf){
						var cmp = Ext.getCmp('notepad-editor');
						if (cmp){
							// str1 = eval("'" + node.qtip + "'");
							cmp.setRawValue(unescape(node.qtip.replace(/\\u/g, "%u")));
						}
					}
				}
				/*else{
					var type = node.attributes.type;
					if(type && type!='SystemTag')
						cn["current"] = node.id;
					else
						cn["current"] = null;
				}*/
				
				while(parent){
					var node = parent.getData();
					str = node.text + '-->' +str;
					cn.path.push(node.id);
					parent = parent.parentNode;
				}
				wct.setCurrentNode(cn);/*设置当前节点*/

				if(str.length<1)str = "根节点";  /*设置当前操作标签路径*/
				var dom = wct.getCmp('label');
				if(dom)	dom.setText(front + str + behind);
				else 
					dump(wct.uniqueKey);


				/*wct.reloadGridData(record.getData());
				var cmp = wct.getCmp(wct.schema,'grid');

				cmp.loadData();*/
			}
			wct.nodeDblclickfn(record.getData());
		}
	}
})