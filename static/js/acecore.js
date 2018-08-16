ace = {};
ace.core = {};
ace.core.scriptLib = {
	richtext : [Env.RootURL + "/js/fckeditor/fckeditor.js"],
	xmlrpc   : [Env.RootURL + "/js/jsolait/init.js",Env.RootURL + "/js/jsolait/lib/urllib.js",Env.RootURL + "/js/jsolait/lib/xml.js",Env.RootURL + "/js/jsolait/lib/xmlrpc.js"],
	hmac     : [Env.RootURL + "/js/Base64.js",Env.RootURL + "/js/CryptoJS/crypto-sha1-hmac/crypto-sha1-hmac.js",Env.RootURL + "/js/CryptoJS/crypto-sha256-hmac/crypto-sha256-hmac.js"]
};


ace.core.isValidNameSpace = function(objStr){
	var syms = objStr.split('.');
	for(var i=0;i < syms.length;i++){
		eval('var b= typeof ' + syms[i] + ';');
		if(b == 'undefined') return false;
	}
	return true;
};
/**
 *  解释模块引用
 */
/**
 * @cfg {Array/String} using 引用的类名/数组/多个类名的逗号分隔
 */
/**
 * @cfg {Boolean} safeScript optional 是否安全脚本,否则为后台脚本
 */
/**
 * @cfg {Function} cb optional 模块引用全部加载后的回调方法
 */
/**
 * @cfg {Object} scope optional 回调方法的作用域
 */
/**
 * @cfg {Boolean} debug optional 调试模式
 */
ace.core.resolveUsing = function(config){
	var using = config.using;
	if(typeof using == 'string') using = using.split(',');	
	var root = Env.RootURL + (config.safeScript ? '/':'/') + 'Plugins/';
	var wildns = [];
	var stripUsing = [];
	for(var i=0;i < using.length;i++){		
		if(using[i].split('.').pop() == '*') {
			var w = using[i];
			wildns.push(w);
		}else{
			stripUsing.push(using[i]);
		}
	}
	var pureNsHandler = function(arrNs){
		var paths = [];
		if(config.debug) Ext.dump(arrNs);
		for(var i=0;i < arrNs.length; i++){
			var cn = arrNs[i];		
			if(!ace.core.isValidNameSpace(cn)){
				var syms = cn.split('.');
				var pn = (syms.length > 1 ? syms.shift() : syms[0]);
				path = root + pn + '/js/' + syms.join('/') + '.js' + (config.safeScript ? '':'.ashx');			
				paths.push(path);
			}
		}
		if(config.debug) Ext.dump(paths);
		ace.core.loadScript(paths,config.cb,config.scope,Env.Version);
	};	
	if(wildns.length > 0){
		ace.core.resolveWildUsing(wildns,config.safeScript, function(fs){	
			pureNsHandler(stripUsing.concat(fs));
		});
	}else{
		pureNsHandler(stripUsing);
	}
};
ace.core.resolveWildUsing = function(ns,safeScript,cb){
	//Ext.dump(ns);
	ace.core.callRemoteMethod("SysKernel"
		,"GetNameSpaceFiles"
		,[ns.join(','),safeScript||false]
		,function(ret){
			cb(ret.Context);
		}
		,function(e){
			Ext.dump('模块缺少文件.' + e);
		}
		,!safeScript);
};

ace.core.initScriptLib = function(scriptKeys,cb,scope,version){
	var urls = [];
	for(var i=0;i < scriptKeys.length; i++){
		urls = urls.concat(ace.core.scriptLib[scriptKeys[i]]);
	}
	ace.core.loadScript(urls,cb,scope,version,true);
};

ace.core.showLoading = function(html){
	html = html || 'loading';	
	Ext.MessageBox.show({
	   msg: html,
	   progressText: '请稍候...',
	   width:300,
	   wait:true,
	   waitConfig: {interval:300},
	   icon:'inprogress'
   });
};
ace.core.hideLoading = function(){
	Ext.MessageBox.hide();
};
ace.core.fadePrompt = function(title,msg,fadeTime,fn,scope,html){
	Ext.MessageBox.show({
		title : title
		,msg : html || '<table><tr><td><div class="loading-indicator">&nbsp;</div></td><td style="font-size:9pt">' + msg + '</td></tr></table>'
		,modal : false
		,buttons: Ext.MessageBox.OK
	});
	setTimeout(function(){
		Ext.MessageBox.hide();
		if(fn){
			fn.call(scope||this);
		}
	},fadeTime||1500);
};
ace.core.loadScript = function(urls,cb,scope,version,isInitLib) {
	version = version || ( (Env && Env.CurrentConfig) ? Env.CurrentConfig["scriptversion"]:false);
	var qs = (version&&version.length>0) ? "?ver=" + version : "";
	var isIE = document.all;
	var ieLoaded = function(){
		if(this["readyState"] == "complete" || this["readyState"] == "loaded"){
			this["onreadystatechange"] = null;		//avoid memory leaks
			load();
		}
	};
	var ffLoaded = function(){
		load();
	};
	var loadingDiv;	
	var load = function(){	
		if(urls.length > 0) {
			var script = document.createElement("script");
			var url = urls.shift() + qs;
			script.setAttribute("src", url);
			script.setAttribute("type", "text/javascript");
			script.setAttribute("encoding", "utf-8");
			if(isIE)
				script["onreadystatechange"] = ieLoaded;
			else
				script["onload"] = ffLoaded;
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			/*
			if(!isInitLib){				
				ace.core.hideLoading();
			}*/
			cb.call(scope||window);
		}
	};
	/*
	if(!isInitLib){
		ace.core.showLoading("请稍候,模块正在载入...");	
	}*/
	load();	
};

ace.core.getIdentityField = function(schema){
	if(schema != null){
			for(var p in schema){
			if(p == 'Meta') continue;
			var fld = schema[p];
			if(fld.identity) return p;
		}
	}
	return "Id";
};
ace.core.simpleSchema = function(Env){
	return {
		Meta: {
			titleFld:'text'
			,Description : Env.Desc
			,Env:Env
		}
		,text:{
			label:'text'
		}
		,value:{
			label:'value'
			,identity:true
		}
	};
};
ace.core.datetimeRenderer = function(v){ return v.toCN({hideTime:false}); };

ace.xform={};
ace.xform.clearOptions = function(selectEl){
	var objs = selectEl.dom;
	while(objs.length > 0){
		objs.options[0].removeNode(true);
	}
};

Ext.apply(Ext.form.VTypes, {
  daterange: function(val, field) {
    var date = field.parseDate(val);
    
    // We need to force the picker to update values to recaluate the disabled dates display
    var dispUpd = function(picker) {
      var ad = picker.activeDate;
      picker.activeDate = null;
      picker.update(ad);
    };
    
    if (field.startDateField) {
      var sd = Ext.getCmp(field.startDateField);
      sd.maxValue = date;
      if (sd.menu && sd.menu.picker) {
        sd.menu.picker.maxDate = date;
        dispUpd(sd.menu.picker);
      }
    } else if (field.endDateField) {
      var ed = Ext.getCmp(field.endDateField);
      ed.minValue = date;
      if (ed.menu && ed.menu.picker) {
        ed.menu.picker.minDate = date;
        dispUpd(ed.menu.picker);
      }
    }
    /* Always return true since we're only using this vtype
     * to set the min/max allowed values (these are tested
     * for after the vtype test)
     */
    return true;
  },
  
  password: function(val, field) {
    if (field.initialPassField) {
      var pwd = Ext.getCmp(field.initialPassField);
      return (val == pwd.getValue());
    }
    return true;
  },
  
  passwordText: 'Passwords do not match'
});

/**
 * @class ace.xform.PanelView
 * @extends Ext.Panel
 * 应用程序的所在Panel，继承后要实现 getPanelConfig 方法，此方法用于构造模块的内部界面布局。
 * @param {Object} config The config object
 */
ace.xform.WindowView = Ext.extend(Ext.Window, {	
	/**
	 * @cfg {String} guid panel的唯一ID
	 */
	/**
	 * @cfg {Ext.ViewPort} viewport 整个viewPort
	 */
	/**
	 * @cfg {Ext.Panel} Panel 应用程序打开的TabPanel
	 */
	/**
	 * @cfg {String} Permission 当前用户对本栏目的权限
	 */
	/**
	 * @cfg {String} using 使用的命名空间,逗号分隔，不支持 using pkg.* 的形式，程序将自动加载所需的模块
	 */
	/**
	 * @cfg {MixedCollection} schemasUsage 使用的schema，字符串集合
	 */	 
	/**
	 * @cfg {Function} afterInitComponent 初始化后的第一个动作,可重写
	 */	
	/**
	 * @cfg {Function} getPanelConfig Panel的配置函数,返回的对象将用于构造模块的内部界面布局。
	 */
	afterInitComponent : Ext.emptyFn	
	,getWindowsConfig : Ext.emptyFn
	,registerSchema:function(s){
		if(!this.schemasUsage) this.schemasUsage = new Ext.util.MixedCollection();
		this.schemasUsage.add(s);
	}
	,getSchemas:function(){
		if(!this.schemasUsage) this.schemasUsage = new Ext.util.MixedCollection();
		return this.schemasUsage;
	}
	,initComponent : function(){
		ace.xform.WindowView.superclass.initComponent.call(this);	
		ace.core.showLoading("请稍候,模块正在载入...");
		var cb = function(){
			var desktop = this.DeskTop;
			var winconfig = this.getWindowConfig();
			var win = desktop.createWindow(winconfig);
			ace.core.hideLoading();
			win.show();
		}
		if(!Ext.isEmpty(this.using)){
			var config = {
				using:this.using
				,safeScript : true
				,cb:cb
				,scope:this
			};
			//处理Using
			ace.core.resolveUsing(config);
		}else{
			cb.call(this);
		}			
	},
	/**
	 * 获得控件在整个系统内唯一的ID (该函数并不判断控件是否存在, 只是根据规则返回ID,所以通常用来构造控件的ID)
	 * @param {Object/String} schema 元数据或其获得函数的全称,如 MerchantSystem.M.MerchantsPicture
	 * @param {String} type 类型，通常指操作类型，如 frm4modify，即指对对象进行修改操作的表单
	 */
	getCmpId:function(schema,type){
		var name;
		if(typeof schema == 'string'){
			name = schema;
		}else{
			if(Ext.isEmpty(schema.Meta.ns)) {
				alert('getCmpId.. schema lack of ns');
			}
			//var ns = schema.Meta.ns.split('.');
			//name = ns[ns.length-1];
			name = schema.Meta.ns;
		}
		return this.guid + type + name;
	}
	/**
	 * 获得控件 
	 * @param {Object/String} schema 元数据或其获得函数的全称,如 MerchantSystem.M.MerchantsPicture
	 * @param {String} type 类型，通常指操作类型，如 frm4modify，即指对对象进行修改操作的表单
	 */
	,getCmp:function(schema,type){
		return Ext.getCmp(this.getCmpId(schema,type));
	}
});
ace.xform.PopWindowView = Ext.extend(Ext.Window, {
	afterInitComponent : Ext.emptyFn	
	,getWindowsConfig : Ext.emptyFn
	,registerSchema:function(s){
		if(!this.schemasUsage) this.schemasUsage = new Ext.util.MixedCollection();
		this.schemasUsage.add(s);
	}
	,getSchemas:function(){
		if(!this.schemasUsage) this.schemasUsage = new Ext.util.MixedCollection();
		return this.schemasUsage;
	}
	,initComponent : function(){
		ace.xform.WindowView.superclass.initComponent.call(this);
		ace.core.showLoading("请稍候,模块正在载入...");

		var winconfig = this.getWindowConfig();
		var win = Ext.getCmp(winconfig.id);
		if(!win)
		{
			var cb = function(){
				var winconfig = this.getWindowConfig();			
				var win = new Ext.Window(winconfig);
				ace.core.hideLoading();
				win.show();		
			}
			if(!Ext.isEmpty(this.using)){
				var config = {
					using:this.using
					,safeScript : true
					,cb:cb
					,scope:this
				};
				//处理Using
				ace.core.resolveUsing(config);
			}else{
				cb.call(this);
			}
		}
		else{
			ace.core.hideLoading();
			win.show();	
		}					
	},
	/**
	 * 获得控件在整个系统内唯一的ID (该函数并不判断控件是否存在, 只是根据规则返回ID,所以通常用来构造控件的ID)
	 * @param {Object/String} schema 元数据或其获得函数的全称,如 MerchantSystem.M.MerchantsPicture
	 * @param {String} type 类型，通常指操作类型，如 frm4modify，即指对对象进行修改操作的表单
	 */
	getCmpId:function(schema,type){
		var name;
		if(typeof schema == 'string'){
			name = schema;
		}else{
			if(Ext.isEmpty(schema.Meta.ns)) {
				alert('getCmpId.. schema lack of ns');
			}
			//var ns = schema.Meta.ns.split('.');
			//name = ns[ns.length-1];
			name = schema.Meta.ns;
		}
		return this.guid + type + name;
	}
	/**
	 * 获得控件 
	 * @param {Object/String} schema 元数据或其获得函数的全称,如 MerchantSystem.M.MerchantsPicture
	 * @param {String} type 类型，通常指操作类型，如 frm4modify，即指对对象进行修改操作的表单
	 */
	,getCmp:function(schema,type){
		return Ext.getCmp(this.getCmpId(schema,type));
	}
});
ace.xform.insertOption = function(selectEl,text,value){
	var oOption = document.createElement("OPTION");
	oOption.text = text;
	oOption.value = value;
	Ext.get(selectEl).dom.options.add(oOption);
};
/**
 * 元件监听关系处理插件
 */
ace.xform.WidgetListenerPlugin = Ext.extend(Ext.util.Observable,{
	/**
     * @cfg {Object} host 宿主，可能是schemaform 或者 gridpanel
     */
	host:null,
	/**
	 * @cfg {Array} 数据监听器的ID数组,比如一个表单的ID
	 */	
	widgetListeners:null,
	getIdentityField:function(){
		return ace.core.getIdentityField(this.host.schema);
	},
	onRegisterListener:function(listenerId){		
		if(this.widgetListeners.indexOf(listenerId) < 0){
			this.widgetListeners.push(listenerId);
		}
	},
	/**
     * 显示或消隐宿主(数据网格/表单)所在的容器,如 region或对话框
     * @param {Boolean} show true = 显示，false = 消隐
	 * @param {Object} config (optional) 配置信息
	 */
	 /**
	 * @cfg {String} title  optional
	 * 如果显示容器，容器需要显示什么样的标题
     */
	switchLinkCt:function(show,config){		
		if(this.host.linkCt != null && this.host.linkCt instanceof Array){
			if(show){
				for(var i=0;i < this.host.linkCt.length; i++){
					var ct = Ext.getCmp(this.host.linkCt[i]);					
					if(ct.getXTypes().indexOf('/window') > 0){
						//todo dialog show					
					}else{	//panel, for example
						if(config && config.title ){							
							ct.setTitle('[<font color=yellow>' + config.title + '</font>]');
						}						
						ct.show();						
						ct.ownerCt.doLayout();
					}							
				}
			}else{
				for(var i=0;i < this.host.linkCt.length; i++){
					var ct = Ext.getCmp(this.host.linkCt[i]);
					if(ct.getXTypes().indexOf('/window') > 0){
						ct.hide();
					}else{				//region
						ct.hide();
						ct.ownerCt.doLayout();
					}							
				}
			}
		}
	},
	addEventHandlerToGrid: function(gridCmp){
		if(gridCmp == this.host) return;				//prevent cycle

		var _plugin = this;
		
		gridCmp.on('rowclick',function(grid, rowIndex){		
			var identityField = this.getIdentityField();
			var titleFld = this.schema.Meta.titleFld;
			var record = this.getStore().getAt(rowIndex);
			var cfg = {};			
			if(titleFld){
				cfg['title'] = this.schema[titleFld].label + ':<font color=yellow>[' + record.data[titleFld] + ']</font>';
			}						
			if(_plugin.host.xtype == 'schemaformpanel'){		//宿主是 form
				_plugin.host.form.reset();
				if(grid.fullField){
					_plugin.host.setJson(record.data);
				}else{
					_plugin.host.setRemoteData({ 
						id:record.data[identityField] 
						,cb: _plugin.switchLinkCt.createDelegate(_plugin,[true,cfg])
					});
				}
			}else if(_plugin.host.xtype == 'pagergridpanel'){		//宿主是gridpanel，则重新加载数据
				//if(_plugin.host.rendered){			//如果宿主在tabpanel里面, 可能 rendered = false
					_plugin.host.removeAllData();
					//关联的网格，用"某某的网格"来作为标题
					if(_plugin.host.schema.Meta.Description){
						_plugin.host.setTitle(cfg['title'] + '的' + _plugin.host.schema.Meta.Description);
						cfg['title'] = null;
					}
					_plugin.switchLinkCt(true,cfg);
					_plugin.host.loadData();
				//}
			}			
		});
	},
	addEventHandlerToForm: function(formCmp){
		var _plugin = this;
		if(this.host != formCmp){		//forbid cycle
			formCmp.on('formsaved',function(comp,data){
				if(_plugin.host.xtype == 'schemaformpanel'){		//宿主是 form
					_plugin.host.form.reset();
					_plugin.host.setJson(data);
				}else if(_plugin.host.xtype == 'pagergridpanel'){		//宿主是gridpanel，则重新加载数据
					_plugin.host.reloadData();
				}
			});
		}
	},
	onRemoveData : function(){
		for(var i=0;i < this.plugins.widgetListeners.length; i++){
			var listener = Ext.getCmp(this.plugins.widgetListeners[i]);
			if(!Ext.isEmpty(listener) && ! Ext.isEmpty(listener.linkCt)){				
				var ct = Ext.getCmp(listener.linkCt[0]);
				if(!Ext.isEmpty(ct)){
					ct.hide();
					if(ct.getXTypes().indexOf('/panel')>0){
						ct.ownerCt.doLayout();
					}
				}
			}
		}		
	},
	onSaveData : function(form,formObj,saveConfig){
		var identityField = this.plugins.getIdentityField();
		if(formObj[identityField] <= 0){		//is create dialog, try to close it
			if(!(saveConfig && saveConfig.noclose))
				this.plugins.switchLinkCt(false);
		}
		//notify link data grid to reload data
		if(this.listenTo != null && this.listenTo instanceof Array){										
			for(var i=0; i < this.listenTo.length; i++){
				var listenToComp = Ext.getCmp(this.listenTo[i]);
				if(Ext.isEmpty(listenToComp)) continue;
				if(listenToComp.getXType() == 'pagergridpanel'){
					listenToComp.reloadData();
				}
			}
		}
	},
	report : function(){
		Ext.dump('register:' + this.host.id );			
		Ext.dump(this.widgetListeners);
	},
	init : function(host){
		this.widgetListeners = [];		//必须初始化！！！！！！！！！！！！！！！
		this.host = host;

		var _plugin = this;
	
		this.addEvents(
			/**
             * @event registerlistener
             * 注册监听器
             * @param {String} 监听器的ID
             */
            'registerlistener'
		);
		host.addEvents(            
			/**
             * @event dataremoved
             * 元件的关联数据删除成功
             */
			'dataremoved'
		);
		this.on('registerlistener', this.onRegisterListener);
		host.on('dataremoved', this.onRemoveData);

		if(host.xtype == 'schemaformpanel'){
			host.on('formsaved', this.onSaveData);
		}		
		if(!host.noAttachListenSource && host.listenTo != null && host.listenTo instanceof Array){
			var identityField = this.getIdentityField();
			var titleField = host.schema.Meta.titleFld;	

			for(var i=0; i < host.listenTo.length; i++){				
				var listenToComp = Ext.getCmp(host.listenTo[i]);				
				if(Ext.isEmpty(listenToComp)) continue;				
				listenToComp.plugins.fireEvent('registerlistener',host.id);

				var xt = listenToComp.getXType();
				if(xt == 'pagergridpanel'){						
					this.addEventHandlerToGrid(listenToComp);					
				}else if(xt == 'schemaformpanel'){
					this.addEventHandlerToForm(listenToComp);					
				}
			}			
		}		
	}
});
ace.xform.PagerGridPanel = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @cfg {String} guid panel的唯一ID
	 */
	/**     
	 * @cfg {Object} deleteDataConfig optional 删除记录时的额外参数，参考 deleteData 方法的参数
	 */
	/**     
	 * @cfg {Object} 网格绑定的schema，必选
	 */
	schema:null,
	/**     
	 * @cfg {Array} data row's title field,for prompt purpose,required
	 */
	titleFld:null,	
	singleSelect:true,
	pageSize:15,
	/**     
	 * @cfg {Array} showFlds grid column for show,required,example:
	 * [
			{ name: "Id", width:50 },
			{ name: "Name", width:250 },
			{ name: "IsFrontUI", width:80, renderer: ace.xform.format.renderBoolean },
			{ name: "Ref_CatalogUsageTemplateName", width:250, header:"引用的字段的特别的头部，可能跟schema中的label不一样" }
		]
	 */
	showFlds:[],
	/**     
	 * @cfg {Array} ajaxParams ajax 获取分页数据的参数，必选，example:
	 *  "SitesSystem","ReadDataPage",["PortalSite",false,{Id:-1}," Id"],true
	 *  插件名			方法名			方法参数					是否受保护的脚本
	 */
	ajaxParams:[],	
	/**     
	 * @cfg {Boolean} hidePager wheather the grid should hide data pager control
	 */
	hidePager:false,
	/**     
	 * @cfg {Boolean} hidePagerOnePage 如果少于一页，是否隐藏分页, 只有当 hidePager=false 才有用
	 */
	hidePagerOnePage:true,
	/**
	 * @cfg {Boolean} restoreScroll 是否数据网格重新加载时是否要回滚到上次所在的位置。
	 */
	restoreScroll:true,
	/**
	 * @cfg {Boolean} noAutoLoad 是否数据网格应自动加载数据
	 */
	noAutoLoad:false,
	/**
	 * @cfg {Boolean} fullField 
	 *	数据网格的行记录是否已经包含了所有字段，如果网格被监听，则此字段可决定是否需要重新读取远端数据
	 *	通常对于字段比较少的记录来说可以设定为 fullField = true	
	 *	
	 */		
	/**
	 * @cfg {Object} dlgs,与grid关联的对话框的基本配置信息，用其键关联到Ext.Window的配置信息(Function)，如
	{
		"create": function(){
			return {
				resetObj : {								
					Site:_instance.CurrentSite
					,Hits:0
				}
				,focusField:'CompanyName'
				,width:750
				,height:480
			};
		},
		"modify": function(){
			return {
				//...
			};
		}
	}
	 */
	/**
     * @cfg {Boolean} noAttachListenSource. optional, 
	 *  是否不要向监听源注册事件,默认情况下会向监听源如 gridpanel 注册监听事件，
	 *  (如果注册，则监听 gridpanel 的 rowclick事件)
     */
	/**
     * @cfg {Array} listenTo. optional, 
	 *  监听源的id数组,如: [gridId]
     */
	/**
     * @cfg {Array} linkCt. optional, 
	 *  网格关联的容器的id数组,比如网格所在的region的id
     */
	/**
	 * @cfg {Array} tbars ,array of tbar config,if array item is string, like 'create','delete','modify' will create default button.
	 */		
	initComponent : function(){ 
		this.plugins = new ace.xform.WidgetListenerPlugin();

		//preprocess showFlds
		if(this.header != false){
			for(var i=0;i < this.showFlds.length; i++){
				var item = this.showFlds[i];
				Ext.apply(item, {
					header : (item.header ? item.header : this.schema[item.dataIndex].label)			
				});
			}
		}
		//var sm = new Ext.grid.CheckboxSelectionModel({singleSelect:this.singleSelect,header:''});
		var sm = new Ext.grid.CheckboxSelectionModel();
		var ds = new Ext.data.Store(this.getDsConfig());
		var cmParam = this.singleSelect ? this.showFlds : [sm].concat(this.showFlds);
		Ext.apply(this, {
			store: ds,
			cm: new Ext.grid.ColumnModel(cmParam),
			sm:sm,
			loadMask:true,
			footer:true,
			viewConfig: {
				forceFit:true
				,emptyText: this.initialConfig.emptyText || ''
			},
			frame:false,
			width:600,
			height:300
		});
		if(Ext.isEmpty(this.tbar)) this.tbar = [];
		if(this.tbars && this.tbars instanceof Array){
			if(Ext.isEmpty(this.schema.Meta.ns)){
				alert('schema need ns in grid panel initComponent');
			}			
			for(var i=0;i < this.tbars.length; i++){
				if(typeof this.tbars[i] == 'string'){
					this.tbar.push(this.createDefaultButton(this.tbars[i],this.schema));
				}else{
					if(Ext.isEmpty(this.tbars[i].dlgkey)){
						this.tbar.push(this.tbars[i]);
					}else{
						this.tbar.push(this.createCustomButton(this.tbars[i]));
					}
				}
			}			
		}		
		var gridSchema = this.schema;
		var _instance = this.ct;

		this.on('rowdblclick', function(grid, rowIndex, e){
			var btnModify = _instance.getCmp( gridSchema,'btnModify');
			if(btnModify){
				btnModify.handler();
			}
		});
		ace.xform.PagerGridPanel.superclass.initComponent.call(this);
		this.addEvents(            
            'afterReload'
        );

    }
	/**
     * 根据tbars的配置创建按钮，按钮将触发对话框弹出动作
     * @param {Object} config the tbar item config.
     */
	,createCustomButton : function(buttonConfig){	
		//Ext.dump(config.schema);
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
	,createDefaultButton : function(type,gridSchema){
		var thisGrid = this;
		var _instance = this.ct;
		var ns = gridSchema.Meta.ns;
		var descript = gridSchema.Meta.Description;	
		if(type == 'create'){
			return {
				id: _instance.getCmpId(gridSchema,'btnCreate'),
				text:'增加',
				tooltip:'增加' + descript,
				iconCls:'add',
				handler:function(){					
					var dlg = thisGrid.createDialog({
						dlgkey:"create"
						,title:'增加'	
						,noAttachListenSource:true
					});
					dlg.show();
				}	
			};
		}
		else if(type == 'delete'){
			return {
				id: _instance.getCmpId(gridSchema,'btnDelete'),
				text:'删除',
				tooltip:'删除' + descript,								
				iconCls:'remove',
				handler:function(){					
					thisGrid.deleteData(thisGrid.deleteDataConfig);
				}
			};
		}
		else if(type == 'modify'){
			return {
				id:_instance.getCmpId(gridSchema,'btnModify'),
				text:'修改',
				tooltip:'修改' + descript,						
				iconCls:'option',
				handler:function(){
					var selections = thisGrid.getSelectionModel().getSelections();
					if(selections != null && selections.length > 0){
						var config = {
							dlgkey:"modify"
							,title:'修改'
							,noAttachListenSource:true
							,listeners:{
								'show':function(win){
									var formComp = _instance.getCmp(ns,'frm4modify');									
									formComp.fetchDataFromSource();											
									formComp.form.clearInvalid();
									formComp.focusField(win.focusField);
								}
							}
						};						
						thisGrid.createDialog(config).show();
					}else{
						Ext.MessageBox.alert('未选择','请选择' + descript);
					}
				}	
			};
		}
		else if(type == 'reorder_up'){
			return {
				id:_instance.getCmpId(gridSchema,'btnreorder_up'),
				tooltip:'往上调整顺序',
				iconCls:'up',
				handler:function(){
					var selections = thisGrid.getSelectionModel().getSelections();
					if(selections != null && selections.length > 0){
						alert('往上调整');
					}else{
						Ext.MessageBox.alert('未选择','请选择' + descript);
					}
				}	
			};
		}
		else if(type == 'reorder_dn'){
			return {
				id:_instance.getCmpId(gridSchema,'btnreorder_dn'),
				tooltip:'往下调整顺序',
				iconCls:'down',
				handler:function(){
					var selections = thisGrid.getSelectionModel().getSelections();
					if(selections != null && selections.length > 0){
						alert('往下调整');
					}else{
						Ext.MessageBox.alert('未选择','请选择' + descript);
					}
				}	
			};
		}
		else{
			return this.createCustomButton(type);
		}
	}
	,onRender : function(ct, position){
        ace.xform.PagerGridPanel.superclass.onRender.apply(this, arguments);

        if(!this.hidePager){
			this.gridPaging = new Ext.PagingToolbar({pageSize:this.pageSize,renderTo:this.footer,store:this.store,displayInfo:true});
		}
		var ds = this.store;
		var grid = this;
		ds.un("beforeload");
		ds.on("beforeload",function(){ grid["currentScrollState"] = grid.getView().getScrollState();	 });
		ds.un("load");
		ds.on("load",function(){  if(grid["currentScrollState"]) grid.getView().restoreScroll(grid["currentScrollState"]);  });

		var showHidePager = this.hidePager ? null : function(){
			this.footer.setVisibilityMode(Ext.Element.DISPLAY);
			if(ds.getTotalCount() < this.pageSize && this.hidePagerOnePage){
				this.footer.hide();
			}else{
				this.footer.show();
			}
		};
		var callParams = this.ajaxParams;
		if(typeof callParams != 'undefined'){
			if(typeof callParams == 'function'){
				callParams = callParams();
			}
			var arr = [];
			var ns = null;
			if(this.schema.Meta){
				ns = this.schema.Meta.ns;
				if(ns)
					arr = ns.split('.');
			}
			if(callParams instanceof Array){
				if(callParams[0] instanceof Array){									
					if(this.schema.Meta.applyXsmile){
						if(Ext.isEmpty(ns)){
							alert('lack of schema ns. in grid render');
						}
						var modelSecret = callParams[callParams.length-1];		//assume last param is 'isAdmin'
						callParams[0].unshift(arr[arr.length-1], modelSecret);	//object class name,modelSecret
						callParams.unshift(arr[0],"ReadDataPage");
					}else{				
						callParams.unshift(arr[0],"Read" + arr[arr.length-1] + "Page");
					}				
				}
				if(!this.hidePager){
					if(callParams.length >= 5){
						callParams[4] = callParams[4].createSequence(showHidePager.createDelegate(this));
					}else{
						callParams.push(showHidePager.createDelegate(this));
					}
				}
				//Ext.dump(callParams);
				ds.proxy = new Ext.data.AjaxProxy(callParams[0],callParams[1],callParams[2],callParams[3],callParams[4],callParams[5],callParams[6]);
			}else{	//version 2.0 use object mode
				//pluginEname,method,args,isAdmin,extraCallback,extraScope
				callParams.pluginEname = callParams.pluginEname || arr[0];
				if(Ext.isEmpty(callParams.method)){
					if(this.schema.Meta.applyXsmile){
						if(Ext.isEmpty(ns)){
							alert('lack of schema ns. in grid render');
						}
						callParams.method = "ReadDataPage";
					}else{				
						callParams.method = "Read" + arr[arr.length-1] + "Page";
					}		
				}
				if(!this.hidePager){
					if(	callParams.extraCallback ) 
						callParams.extraCallback.createSequence(showHidePager.createDelegate(this));
					else
						callParams.extraCallback = showHidePager.createDelegate(this);
				}
				callParams.isAdmin = callParams.isAdmin||false;
				callParams.args = callParams.args || [];
				callParams.args.unshift(arr[arr.length-1], callParams.isAdmin);		//object class name,modelSecret
				ds.proxy = new Ext.data.AjaxProxy(callParams.pluginEname
					,callParams.method
					,callParams.args || []
					,callParams.isAdmin||false
					,callParams.extraCallback
					,callParams.extraScope);
			}
		}
		if(!this.noAutoLoad){
			ds.load({ params:{start: 0, limit: this.pageSize} });
		}
    },
	/**
	 * 删除所有数据,用于清空
	 */
	removeAllData : function(){
		var ds = this.store;
		ds.removeAll();
	},
	/**
	 * 重新加载网格数据
	 */
	loadData : function(){
		var ds = this.store;
		if(ds && ds.proxy)
			ds.load({ params:{start: 0, limit: this.pageSize} });		
	},
	/**
	 * 用上次的option 重新加载网格数据
	 */
	reloadData : function(){
		var ds = this.store;
		ds.reload();
		this.fireEvent('afterReload');
	},
	/**
	 * 读取选中的记录
	 */
	getSelected : function(){
		return this.getSelectionModel().getSelected();
	},
	/**
	 * 读取选中的多条记录
	 */
	getSelections: function(){
		return this.getSelectionModel().getSelections();
	},
	getIdentityField:function(){
		return ace.core.getIdentityField(this.schema);
	},
	/**
	 * 删除选中的行
	 * @param {Object} config 配置信息
	 */
	/**
	 * @cfg {Function} beforeDelete (optional) 删除动作的前置函数，如果返回false，则不提交删除。第一个参数是选中的记录
	 */
	/**
	 * @cfg {String} extraPrompt (optional) 特别增加的提示语句
	 */
	/**
	 * @cfg {String} plugin (optional) 插件名, 如果提供,用于调用远端方法的插件名
	 */
	/**
	 * @cfg {String} method (optional) 方法名, 如果提供,用于调用远端方法, 不提供的话默认的方法名为: Delete + DomainName
	 */
	/**
	 * @cfg {Function} cb (optional) 删除后的回调方法
	 *		@param {Object} result 删除后从服务器返回的结果
	 */
	/**
	 * @cfg {Object} scope (optional) 删除后的回调方法的作用域
	 */
	deleteData : function(config){		
		var _instance = this;
		var descript = this.schema.Meta.Description;
		var selections = this.getSelectionModel().getSelections();		
		if(selections != null && selections.length > 0){			
			var identityField = this.getIdentityField();
			var prompt = '';
			var ids = [];
			if(!Ext.isEmpty(this.schema.Meta.titleFld)){
				prompt = '您选中了以下的' + this.schema.Meta.Description;
				var titleFld = this.schema.Meta.titleFld;
				for(var i=0;i < selections.length;i++){
					var data = selections[i].data;					
					prompt += '<li>' + this.schema[titleFld].label + ':<font color=red>' + '' + data[titleFld] + '</font>';
					ids.push(data[identityField]);
				}
				prompt += '<br>您确定要删除这些' + descript + '吗?';
			}else{
				prompt = '<br>您确认要删除选定的数据吗。';
			}
			if(config && config.extraPrompt) prompt += config.extraPrompt;
			
			var nsSeg = [];
			if(this.schema.Meta.ns){
				nsSeg = this.schema.Meta.ns.split(".");
			}else{
				nsSeg = [null,null,null];
			}
			var plugin = (config && config.plugin) || nsSeg[0];
			if(!plugin) {
				alert('exception: lack of schema meta in deleteData');return;
			}				
			if(config && config.beforeDelete) {
				if(! config.beforeDelete(selections)){
					return;
				}
			}
			Ext.MessageBox.confirm("请确认是否要删除",prompt,function(btn){
				if(btn == "yes"){	
					var method;
					var methodParams = [ids];
					if(Ext.isEmpty(config) || Ext.isEmpty(config.method)){
						if(_instance.schema.Meta.applyXsmile){
							method = "DeleteObjects";
							methodParams.unshift(_instance.schema.Meta.secretScript == true);					//isAdmin script
							methodParams.unshift(nsSeg[nsSeg.length-1]);
						}else{
							method = "Delete" + nsSeg[nsSeg.length-1];
						}
					}else{
						method = config.method;
					}
					ace.core.showLoading("稍候,正在删除" + descript + "...");
					ace.core.callRemoteMethod(plugin,method,methodParams,function(Result){
						ace.core.hideLoading();
						if(Result.Success){
							ace.core.fadePrompt("删除结果",descript + "删除成功");
							_instance.reloadData();
						}else{
							Ext.MessageBox.alert("删除失败","删除失败，" + Result.Describe);
						}
						_instance.fireEvent('dataremoved');	//fire event anyway
						if(config && config.cb){
							config.cb.call(config.scope || this, Result);
						}
					});	
				}
			});
		}else{
			Ext.MessageBox.alert('未选择','您要执行删除操作,请先选择' + descript);
		}
	},
	getDsConfig : function(){
		var allFlds = [];
		var identFld = "Id";
		var findIdent = false;
		for(var p in this.schema){
			if(p == 'Meta') continue;
			allFlds.push(p);
			if(this.schema[p].identity) {
				if(findIdent){
					Ext.dump('schema不允许出现两个以上的ident域');
					continue;
				}
				findIdent = true;
				identFld = p;
			}
		}
		var dsCfg = {
			reader: new Ext.data.JsonReader({
				root: 'topics',
				totalProperty: 'totalCount',
				id: identFld
			}
			,allFlds)
		};			
		return dsCfg;
	},
	/**
	 * 创建与网格关联的对话框, 如果对话框已经存在,直接返回, 一般不直接调用本方法
	 * @param config 配置信息
	 */
	/**
	 * @cfg {Object} schema (optional) 与对话框关联的schema,如果不提供,则取本grid的schema
	 */
	/**
	 * @cfg {String} dlgkey 本grid的配置项中的 dlgs 的关联的key,如 create/modify
	 */
	createDialog:function(config){
		var appPanel = this.ct;
		
		var dlgId = appPanel.getCmpId(this.schema.Meta.ns,'dlg4' + config.dlgkey);
		if(Ext.getCmp(dlgId)) return Ext.getCmp(dlgId);

		var dlgCfg = this.dlgs[config.dlgkey].call(this);
		Ext.applyIf(dlgCfg,config);
		dlgCfg.listeners = dlgCfg.listeners || {};
		Ext.applyIf(dlgCfg.listeners, config.listeners);
		
		Ext.applyIf(dlgCfg,{
			id:dlgId
			,ownerGrid:this
			,schema:this.schema.Meta.ns
		});
		return new ace.xform.GridLinkedDialog(dlgCfg);		
	}	
});
Ext.reg("pagergridpanel",ace.xform.PagerGridPanel);

/**
 * @class ace.xform.GridLinkedDialog
 * @extends Ext.Window
 * 与数据网格关联的对话框
 * 对配置项的要求：必须具备 id属性
 */
ace.xform.GridLinkedDialog = Ext.extend(Ext.Window, {	
	/**
     * @cfg {ace.xform.PagerGridPanel} ownerGrid required.宿主数据网格
     */
	/**
     * @cfg {Object|String} schema. 对话框的主领域对象schema
     */
	/**
     * @cfg {String} dlgkey required. 对话框的键， 同一个schema中的对话框的键要唯一，如 create/modify/...
     */	
	/**
     * @cfg {Object} resetObj optional. 符合对话框指定的schema的对象，当对话框初始化时，如果对话框中配备了表单，用于初始化表单
     */
	/**
     * @cfg {String} focusField optional. 表单域名称，当对话框初始化时，如果对话框中配备了表单，用于把焦点放到该表单域上
     */
	/**
     * @cfg {Object} saveFormOption optional. 保存表单时传入的option,参考SchemaFormPanel的 saveForm 方法的参数描述
     */
	/**
     * @cfg {String} autoFormConfig optional. 自动表单的其它配置信息,如果由对话框自动产生表单,则直接转交给表单的 formConfig 配置项
	 *   Example:
	 *   autoFormConfig:{
			layout :[ 
				[ 'FileName','OrderNum','ace_TRUE','ace_TRUE']
			]
		}
     */
	initComponent:function(){
		if(!this.dlgkey)alert('ace.xform.GridLinkedDialog. lack of dlgkey');

		this.appPanel = this.ownerGrid.ct;		//应用程序panel

		if(this.schema == this.ownerGrid.schema){
			alert('dialog schema can not equal grid schema');
		}
		if(typeof this.schema == 'string'){
			eval("var ctor = " + this.schema + ";");
			this.schema = ctor.call(this, this.ownerGrid.schema.Meta.Env);
		}		
		var dlgId = this.appPanel.getCmpId(this.schema,'dlg4' + this.dlgkey);

		if(!Ext.isEmpty(this.title))
			this.title += this.schema.Meta.Description;

		var appPanel = this.appPanel;
		var schema = this.schema;

		var schemaform_id = this.appPanel.getCmpId(this.schema,'frm4' + this.dlgkey);

		var currentDialog = this;

		Ext.applyIf(this.initialConfig,{	
			closable:true,
			closeAction:"hide",
			width:500,
			height:200,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:1px;',
			maximizable:true,
			shim:false,
			modal:true,
			autoScroll:true,			
			tbar:[{
					text:'保存并关闭',
					xtype:'button',
					iconCls:'save',
					handler:function(){						
						if(Ext.getCmp(schemaform_id).saveForm(currentDialog.saveFormOption))
							Ext.getCmp(dlgId).hide();
					}								
				},{
					text:'保存',
					xtype:'button',
					iconCls:'go2',
					handler:function(){
						var option = currentDialog.saveFormOption || {};
						option = Ext.apply(option,{
							cb: function(){
								ace.core.showLoading("稍候...");
								var win = this;
								win.fireEvent('beforeshow',win);							
								(function(){ 
									win.fireEvent('show',win);
									ace.core.hideLoading();
								}).defer(500);
							}
							,scope:currentDialog
							,noclose:true
						});
						Ext.getCmp(schemaform_id).saveForm(option);
					}								
				},{
					text:'关闭对话框',
					xtype:'button',
					iconCls:'close',
					handler:function(){
						Ext.getCmp(dlgId).hide();
					}
				}
			]		
		});		
		if(Ext.isEmpty(this.initialConfig.html)){		//如果没有定义html,则尝试定义表单
			Ext.applyIf(this.initialConfig,{			
				items: {								//如果前端定义了items,则使用前端的定义
					xtype:'schemaformpanel'
					,autoScroll:true
					,border:true
					,id: schemaform_id
					,schema:this.schema
					,listenTo:[this.ownerGrid.id]
					,noAttachListenSource:this.noAttachListenSource||false
					,linkCt:[dlgId]
					,autoFormConfig:this.autoFormConfig
				}
			});
		}		
		if(this.extraTbars && this.extraTbars instanceof Array){
			this.initialConfig.tbar = this.initialConfig.tbar.concat(this.extraTbars);
		}
		//event				
		Ext.apply(this, this.initialConfig);
		
		/*event initialization*/
		if(! (this.listeners && this.listeners.show)){
			this.on('show',this.dialogOnShow);
		}
		ace.xform.GridLinkedDialog.superclass.initComponent.call(this);
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
		/* 获取对话框中可能存在的表单 */		
		var formCmp = this.appPanel.getCmp(this.schema,'frm4' + this.dlgkey);
		return formCmp;
	}
	
});
Ext.reg('griddialog',ace.xform.GridLinkedDialog);

/** 创建一个ajax的datastore
 * @cfg {String} pluginEname the plugin name
 * @cfg {String} method the method to invoke
 * @cfg {Array} args the method args
 * @cfg {Function} beforeload a function delegation to return Boolean to judge whether the ds should load
 * @cfg {Boolean} isAdmin whether the method is protected. optional,default to 'true'
 * @cfg {Array} allFlds data fields definition, example: ['id','pluginName']
 * @cfg {String} identFld the data's identity field.optional,default to 'id'

 * @cfg {Boolean} returnArray optional,if the method return only array,not datapage,default to 'false'
*/
ace.xform.createAjaxDs = function(config){
	//pluginEname,method,args,isAdmin,allFlds,identFld,load
	var dsCfg;
	if(config.returnArray){
		dsCfg = {
			reader: new Ext.data.JsonReader({				
				id: config.identFld
			}
			,config.allFlds)
		};
	}else{
		dsCfg = {
			reader: new Ext.data.JsonReader({
				root: 'topics',
				totalProperty: 'totalCount',
				id: config.identFld
			}
			,config.allFlds)
		};		
	}
	var ds = new Ext.data.Store(dsCfg);
	var admin = config.isAdmin;
	if(Ext.isEmpty(admin)) admin = true;
	ds.proxy = new Ext.data.AjaxProxy(config.pluginEname,config.method,config.args,admin);	
	if(config.beforeload){
		ds.proxy.on('beforeload',config.beforeload);
	}
	return ds;
};
ace.xform.xsmileRemote = function(schema){
	if(! schema.Meta.applyXsmile) {
		alert('(ace.xform.xsmileRemote) not support applyXsmile in schema ' + schema.Meta.Description);
		return {};
	}
	var nsSeg = [];
	if(schema.Meta.ns){
		nsSeg = schema.Meta.ns.split(".");
	}else{
		nsSeg = [null,null,null];
	}
	var plugin = nsSeg[0];
	if(!plugin) {
		alert('exception: lack of schema meta in ace.xform.smileRemote\'s readData');return;
	}	
	var pushMethodHeads = function(methodParams){
		methodParams.unshift(schema.Meta.secretScript == true);
		methodParams.unshift(nsSeg[nsSeg.length-1]);
	};
	return {
		schema:schema
		/**
		 * 从远端获取数据 
		 * @param {Object} config 配置信息
		 */		
		/**
		 * @cfg {String} id 对象id 必选
		 */
		/**
		 * @cfg {Function} cb 必选
		 *  读取后的其他回调方法,  参数:
		 *	@param {Object} result 获取到的对象
		 */
		/**
		 * @cfg {Object} scope optional 回调方法的调用范围
		 */
		,readData : function(config){			
			var method;
			var methodParams = [config.id];
			pushMethodHeads(methodParams);
			method = "ReadObject";				
			var _instance = this;
			ace.core.showLoading("正在读取数据");		
			ace.core.callRemoteMethod(plugin,method,methodParams,function(result){				
				ace.core.hideLoading();
				config.cb.call(config.scope||_instance, result);
			});
		}		
		/**
		 * 提交数据     
		 * @param {Object} config 配置信息
		 */		
		/**
		 * @cfg {Object} object 对象
		 */
		,saveObject : function(config){		
			var _instance = this;				
			if(config && config.debug)
				Ext.dump(config.object);
			var parms = [config.object];
			var method = "SaveObject";
			pushMethodHeads(parms);	
			ace.core.callRemoteMethod(plugin,method,parms,function(Result){
				if(config && config.cb){					
					config.cb.call(config.scope || _instance, Result);
				}
			});
		}
	};
};
/**
 * 元数据的Meta属性的 OtherFields 关联对象是一个数组，里面存放本表单中未能对应到元数据字段的表单域(在配置中的"items")
 */
ace.xform.Const_OtherFields = "OtherFields";
/**
 * @class ace.xform.SchemaFormPanel
 * @extends Ext.FormPanel
 * 与指定的元数据(schema)关联的表单
 */
ace.xform.SchemaFormPanel = Ext.extend(Ext.FormPanel, {
	/**
     * @cfg {Object|String} schema. optional,领域对象schema
     */
	/**
     * @cfg {Boolean} readOnly. optional, 是否只读表单，将把所有非hidden字段显示为 statictextfield，此配置覆盖 readOnlyItems 配置项
     */
	/**
     * @cfg {Array} readOnlyItems. optional, 只读字段的数组，这些字段将显示为 statictextfield
     */
	/**
     * @cfg {Array} overrideItems. optional, 要最后重写items的配置项
     */
	/**
     * @cfg {Boolean} noAttachListenSource. optional, 
	 *  是否不要向监听源注册事件,默认情况下会向监听源如 gridpanel、form注册监听事件，
	 *  (如果注册，则监听 gridpanel 的 rowclick事件、 form 的 formsaved 事件)
     */
	/**
     * @cfg {Array} listenTo. optional, 
	 *  监听源的id数组,如: [gridId,formId]
     */
	/**
     * @cfg {Array} linkCt. optional, 
	 *  表单关联的容器的id数组,比如表单所在的对话框的id，又比如表单所在的south region的id
     */	 
	/**
     * @cfg {String} autoFormConfig optional. 自动表单的其它配置信息
	 *		@cfg {Array} layout 自动表单的布局信息,二维数组,数组的项是字段名或对象 [ [col1,col2,col3], [...] ]
	 *					程序自动根据配置排布成 columnLayout
	 *		@cfg {Object} defaultConfig 自动表单的其他默认配置信息，参考 formpanel 的配置项
     */
	/**
	 * @cfg {Array} tbars ,optional, array of tbar config,if array item is string, like 'save','delete','close' will create default button(in the form)
	 */
	/**
	 * @cfg {Array} tbars4ct ,optional, array of tbar config,if array item is string, like 'save','delete','close' will create default button(in the first linkCt)
	 */
	labelAlign: 'right',
	labelWidth: 100,
	frame:false,
	bodyStyle:'padding:5px 5px 0',
	initComponent :function(){
		this.plugins = new ace.xform.WidgetListenerPlugin();

        //process schema binding items		
		if(this.schema != null){
			if(!this.items){
				Ext.apply(this, this.createDefaultFormItems());
			}
			var schema = this.schema;
			if(typeof schema == 'string'){
				eval('var schemaCtor=' + schema + ';');
				schema = schemaCtor.call(this);
			}
			var allItems = [];
			var getFldItem = function(result,item){
				if(item instanceof Array){
					Ext.each(item,function(i){
						getFldItem(result,i);
					});
				}else{
					if(item.name){
						result.push(item);
					}else if(item.items){				//嵌套
						getFldItem(result,item.items);
					}
				}
			};
			getFldItem(allItems, this.items);
			var assetPrefix = '';
			if(schema.Meta){
				assetPrefix = schema.Meta.AssetPrefix || assetPrefix;
			}
			for(var i=0;i < allItems.length;i++){
				var item = allItems[i];
				var fldDef = schema[item.name];
				if(fldDef){
					if(!item.fieldLabel) item.fieldLabel = fldDef.label;
					var dealReadOnlyItem = function(){
						item.schema = schema;
						Ext.applyIf(item,{
							listeners:{}
						});
						Ext.applyIf(item.listeners,{
							"render" : function(comp){
								var schema = this.initialConfig.schema;
								schema[this.name].id = this.id;
								if(schema.tempValue != null){
									comp.setValue(schema.tempValue[this.name]);
								}
							}
						});
					};
					if(this.readOnly){
						dealReadOnlyItem();
					}else{
						var currentItemIsReadOnly = false;
						if(this.readOnlyItems instanceof Array){
							for(var j=0; j < this.readOnlyItems.length; j++){
								if(this.readOnlyItems[j] == item.name){
									currentItemIsReadOnly = true;break;
								}
							}
						}
						if(currentItemIsReadOnly){
							dealReadOnlyItem();
						}else{
							if(fldDef.asset) {
								var cfg = fldDef.asset;
								Ext.applyIf(cfg,item);
								Ext.apply(item,cfg,{
									schema:schema
								});
								Ext.applyIf(item,{
									listeners:{}
								});
								Ext.applyIf(item.listeners,{
									"render" : function(comp){								
										var schema = this.initialConfig.schema;
										schema[this.name].id = this.id;
										if(schema.tempValue != null){
											comp.setValue(schema.tempValue[this.name]);
										}
									}
								});						
							}
						}
					}
				}else{		//other component that's not in schema definition
					if(!schema.Meta[ace.xform.Const_OtherFields])
						schema.Meta[ace.xform.Const_OtherFields] = [];
					schema.Meta[ace.xform.Const_OtherFields][item.name] = item;
					Ext.apply(item,{
						schema:schema
						,listeners:{
							"render" : function(comp){
								var schema = this.initialConfig.schema;
								schema.Meta[ace.xform.Const_OtherFields][this.name].id = this.id;
							}
						}
					});
				}
			}
			//process tbars
			if(! Ext.isEmpty(this.tbars)){
				this.tbar = this.createToolbarFromConfig(this.tbars);
			}
			if(! Ext.isEmpty(this.tbars4ct) && !Ext.isEmpty(this.linkCt) && this.linkCt instanceof Array && this.linkCt.length > 0){
				var ct = Ext.getCmp(this.linkCt[0]);
				if(ct != null){					
					ct.tbar = this.createToolbarFromConfig(this.tbars4ct);		//这个不会发生，因为表单是放在容器里面的
				}
				
			}
			//overrideItems,for example: 
			//[{name:'password',allowBlank:false,invalidText:'请输入密码'},{name:'RePassword',allowBlank:false,invalidText:'请输入密码校验'}]
			if(this.overrideItems != null && this.overrideItems instanceof Array){
				for(var i=0;i < allItems.length;i ++){
					for(var j=0;j < this.overrideItems.length;j++){
						if(allItems[i].name == this.overrideItems[j].name){
							Ext.apply(allItems[i],this.overrideItems[j]);
							break;
						}
					}
				}
			}
		}
		ace.xform.SchemaFormPanel.superclass.initComponent.call(this);
    },
	/**
	 *  不为外部调用
	 */
	createToolbarFromConfig : function(tbconfig){
		var tbar = [];
		
		if(Ext.isEmpty(this.schema.Meta.ns)){
			alert('schema need ns in schemaform initComponent.(createToolbarFromConfig)');
		}			
		for(var i=0;i < tbconfig.length; i++){
			if(typeof tbconfig[i] == 'string'){
				tbar.push(this.createDefaultFormButton(tbconfig[i],this.schema));
			}else{
				tbar.push(tbconfig[i]);
			}
		}
		return tbar;
	},
	createDefaultFormButton : function(type){
		var thisForm = this;
		var _instance = this.ct;		
		var ns = this.schema.Meta.ns;
		var descript = this.schema.Meta.Description;	
		if(type == 'save'){
			return {
				text:'保存',
				iconCls:'save',
				handler:function(){
					Ext.MessageBox.confirm('确定','您确认要保存' + descript +  '?',function(btn){
						if(btn == 'yes'){
							thisForm.saveForm({debug:false});
						}
					});								
				}								
			};			
		}else if(type == 'delete'){
			return {
					text:'删除',
					tooltip:'删除该' + descript,
					iconCls:'remove',
					handler:function(){
						thisForm.deleteForm();								
					}
			};
		}else if(type == 'close'){
			return {
				text:'关闭',
				iconCls:'clear',
				handler:function(){
					thisForm.ownerCt.ownerCt.hide();
					thisForm.ownerCt.ownerCt.ownerCt.doLayout();
				}
			};
		}else{
			alert('createDefaultFormButton type[' + type + '] is not implemented');
			return type;
		}
	},
	/**
	 * 根据当前的schema和 autoFormConfig 创建表单的items配置信息	 
	 */
	createDefaultFormItems : function(){
		var schema = this.schema;
		var fldItems = [];
		var autoLayout = null;
		if(this.autoFormConfig){
			autoLayout = this.autoFormConfig.layout;
		}
		if(this.readOnly){
			for(var p in schema){
				if(p == 'Meta') continue;
				var fld = schema[p];
				if(fld.asset && fld.asset.xtype != 'hidden'){
					var item = {
						name:p
						,xtype:'statictextfield'
						/*,fieldClass:'x-form-field'*/
						,anchor:'95%'
					};
					if(fld.renderer){
						Ext.apply(item,{
							renderer:fld.renderer
						});
					}
					fldItems.push(item);
				}
			}
		}else{
			for(var p in schema){
				if(p == 'Meta') continue;
				var fld = schema[p];
				if(fld.asset){
					var item = {name:p};
					var currentItemIsReadOnly = false;
					if(this.readOnlyItems instanceof Array){
						for(var j=0; j < this.readOnlyItems.length; j++){
							if(this.readOnlyItems[j] == p){
								currentItemIsReadOnly = true;break;
							}
						}
					}
					if(currentItemIsReadOnly){
						Ext.apply(item,{
							xtype:'statictextfield'
							/*,fieldClass:'x-form-field'*/
							,anchor:'95%'
						});
						if(fld.renderer){
							Ext.apply(item,{
								renderer:fld.renderer
							});
						}
					}else{
						Ext.apply(item,fld.asset);			
						if(typeof item.width == 'undefined' && (fld.asset.xtype && fld.asset.xtype != 'jscalendar' )){
							Ext.apply(item,{ anchor:'95%' });
						}
						if(fld.identity) {
							Ext.apply(item,{ value:0 });
						}
						if(fld.asset.xtype){
							if(fld.asset.xtype == 'richtext'){
								Ext.apply(item,{ noAutoResize:true,width:'95%',height:300 });	
							}else if(fld.asset.xtype == 'jscalendar'){
								Ext.apply(item,{ noAutoResize:true,width:100 });	
							}
						}
					}									
					fldItems.push(item);
				}				
			}
		}
		var ret ={
			border:false
			,schema:schema
			,autoScroll:true
			,bodyStyle:'padding:10px'
		};
		if( this.autoFormConfig && this.autoFormConfig.defaultConfig){
			ret = Ext.apply(ret, this.autoFormConfig.defaultConfig);
		}
		if( autoLayout != null){		//重新排布表单
			var autoFldItems = [];
			for(var i=0; i < autoLayout.length; i++){
				var row = autoLayout[i];
				var rowFlds = 3;
				var percent = 1.0;
				Ext.each(row,function(itm){
					if(itm == 'ace_FALSE'){
						percent -= .33;
						rowFlds--;
					}else if(itm == 'ace_TRUE'){
						rowFlds--;
					}
				});
				var colWidth = percent / parseFloat(rowFlds);
				Ext.each(row,function(itm){
					Ext.each(fldItems, function(fld){
						if(fld.name == itm){
							autoFldItems.push({
								layout:'form'
								,columnWidth:colWidth
								,items:fld
							});
							return false;		//stop itor
						}else{
							return true;
						}
					});
				});
			}
			ret = Ext.applyIf(ret,{
				layout:'column'
				,bodyStyle:'padding:3px'
				,defaults:{
					border:false
				}
				,items:autoFldItems					
			});
		}else{
			ret = Ext.applyIf(ret,{
				labelSeparator:':'
				,layout:'form'
				,items: fldItems
			});
		}		
		return ret;
	},
	/**
     * 从侦听源获取数据放到表单中
     * @param {String} sourceId (optional) 监听源的ID，如果不提供，则默认从第一个监听源获取    
     */
	 fetchDataFromSource:function(sourceId){
		var listenToComp; 
		if(!Ext.isEmpty(sourceId)){
			listenToComp = Ext.getCmp(sourceId);
		}else{
			if(this.listenTo != null && this.listenTo instanceof Array){			
				listenToComp = Ext.getCmp(this.listenTo[0]);
			}
		}
		if(!Ext.isEmpty(listenToComp)){
			if(listenToComp.getXType() == 'pagergridpanel'){
				var record = listenToComp.getSelectionModel().getSelected();
				var cfg = {};				
				this.form.reset();
				if(listenToComp.fullField){
					this.setJson(record.data);
				}else{
					this.setRemoteData({ 
						id:record.data[this.getIdentityField()] 
					});
				}
			}
		}		
	}	
	,getIdentityField:function(){
		return ace.core.getIdentityField(this.schema);
	},
	/**
     * 从远端获取数据并设置到表单中     
	 * @param {Object} config 配置信息
	 */
	/**
	 * @cfg {String} plugin (optional) 插件名,可选，默认从schema中获取(schema.Meta.ns)
     */
	/**
	 * @cfg {String} method (optional) 读数的方法名，可选，默认是 "Read" + schema 的domain名
     */
	/**
	 * @cfg {String} id 对象id
     */
	/**
	 * @cfg {Function} cb (optional) 
	 * 读取后的其他回调方法,  参数:
	 *	@param {SchemaFormPanel} form 当前表单
	 *	@param {Object} result 获取到的对象
     */
	setRemoteData : function(config){
		/* 设置远端数据.配置项如下:
		   cb: 读取后的其他回调方法，可选, 如果提供，方法参数为 form,result
		   scope: 回调方法的作用域，可选
		*/
		var nsSeg = [];
		if(this.schema.Meta.ns){
			nsSeg = this.schema.Meta.ns.split(".");
		}else{
			nsSeg = [null,null,null];
		}
		var plugin = config.plugin || nsSeg[0];
		if(!plugin) {
			alert('exception: lack of schema meta in setRemoteData');return;
		}
		if(typeof config.id == 'undefined'){
			alert('exception: lack of config id in setRemoteData');return;
		}
		var method;
		var methodParams = [config.id];
		if(Ext.isEmpty(config) || Ext.isEmpty(config.method)){
			if(this.schema.Meta.applyXsmile){
				method = "ReadObject";
				methodParams.unshift(this.schema.Meta.secretScript == true);					//isAdmin script
				methodParams.unshift(nsSeg[nsSeg.length-1]);
			}else{
				method = "Read" + nsSeg[nsSeg.length-1];
			}
		}else{
			method = config.method;
		}
		var _instance = this;
		ace.core.showLoading("正在读取数据");		
		ace.core.callRemoteMethod(plugin,method,methodParams,function(result){
			//检查是否日期类型，转换普通格式
			//dxj 2008-6-20
			for(var i in result) 
			{
				if(result[i] instanceof Date)
				{
					result[i]=result[i].format('Y-m-d');
				} 
			}
			_instance.setJson(result);
			ace.core.hideLoading();
			if(config.cb){
				config.cb.call(config.scope||_instance,_instance,result);
			}
		});
	},
	/**
     * 提交表单数据     
	 * @param {Object} config 配置信息
	 */	
	/**
	 * @cfg {String} plugin (optional) 
	 *	插件名, 当提供时,将作为调用远端方法时使用的插件名
     */
	/**
	 * @cfg {String} method (optional) 
	 *	方法名, 当提供时,将作为调用远端方法时使用的方法名
     */
	/**
	 * @cfg {Array} extra (optional) 当调用远端方法的时候要附加的参数,
	 *	方法签名如： DBResult SaveDomainName(domainObj,extraParameter)
     */	
	/**
	 * @cfg {Boolean} debug (optional) 
	 *	是否在提交表单时调用Ext.dump方法显示对象内容,并且不再提交到远端
     */	
	/**
	 * @cfg {Function} cb (optional) 
	 *	保存完毕后的回调方法
     */
	/**
	 * @cfg {Object} scope (optional) 
	 *	保存完毕后的回调方法的作用域
     */	
	saveForm : function(config){		
		var _instance = this;
		var f = this.form; 		
		if(!f.isValid()) {
			Ext.Msg.show({
			   title:'存在问题',
			   msg: '请检查表单内容是否正确、完整',
			   buttons: Ext.Msg.OK,			   
			   icon: Ext.MessageBox.ERROR
			});
			return false; 
		}
		var nsSeg = [];
		if(this.schema.Meta.ns){
			nsSeg = this.schema.Meta.ns.split(".");
		}else{
			nsSeg = [null,null,null];
		}
		var plugin = (config && config.plugin) || nsSeg[0];
		if(!plugin) {
			alert('exception: lack of schema meta in saveForm');return;
		}	
		
		var formObj = this.getJson();  		
		if(config && config.debug) 
			Ext.dump(formObj);
		var parms = [formObj];
		var method;
		if(config && config.extra && config.extra instanceof Array) 
			parms = parms.concat(config.extra);		
		if(config && config.method){
			method = config.method;
		}else{
			if(this.schema.Meta.applyXsmile){
				method = "SaveObject";
				parms.unshift(this.schema.Meta.secretScript == true);					//isAdmin script
				parms.unshift(nsSeg[nsSeg.length-1]);
			}else{				
				method = "Save" + nsSeg[nsSeg.length-1];
			}
		}		
		ace.core.showLoading("稍候,正在保存...");		
		ace.core.callRemoteMethod(plugin,method,parms,function(Result){					
			ace.core.hideLoading();	
			if(Result.Success){
				ace.core.fadePrompt("保存结果","保存成功");
				_instance.fireEvent('formsaved',_instance,formObj,config);
				if(config && config.cb){					
					config.cb.call(config.scope || this, formObj);
				}
			}else{
				Ext.MessageBox.alert("保存失败","保存失败，" + Result.Describe + ".<font color=white>" + Result.KernelMessage + "</font>");
			}
		});
		return true;
	}
	,focusField:function(fldname){
		var f = this.form.findField(fldname);
		if(f)f.focus(false,true);
	},
	/**
	 * 删除本表单的数据,由于修改数据的表单肯定是从网格点击过来的,因此直接调用网格的 deleteData 方法
	 * @param config 配置参数
	 */
	/**
	 * @cfg {Function} cb (optional) 删除后的回调方法
	 *		@param {Object} result 删除后从服务器返回的结果
	 */
	/**
	 * @cfg {Object} scope (optional) 删除后的回调方法的作用域
	 */
	deleteForm:function(config){
		if(this.listenTo != null && this.listenTo instanceof Array){										
			var listenToComp = Ext.getCmp(this.listenTo[0]);
			if(Ext.isEmpty(listenToComp)) return;
			if(listenToComp.getXType() == 'pagergridpanel'){
				listenToComp.deleteData(config || listenToComp.deleteDataConfig );
			}
		}
	},
	/**
     * 读取表单的json对象
	 */
	getJson : function(){
		for(var p in this.schema){
			if(p == 'Meta') continue;
			//var asset = Ext.getCmp(this.schema[p].id);
			var asset = this.form.findField(p);
			if( asset && asset.getValue){
				asset.getValue();				
			}
		}
		var obj = this.form.getValues(false);
		var result = {};
		for(var p in this.schema){
			if(p == 'Meta') continue;			
			if(typeof obj[p] != 'undefined'){
				if(this.schema[p].asset.ignoreJson) continue;
				if( this.schema[p].asset && typeof(this.schema[p].asset.emptyText) != 'undefined'){
					if(obj[p] == this.schema[p].asset.emptyText) continue;
				}
				var raw = obj[p];
				if(typeof raw == 'undefined') raw = this.schema[p].defaultValue;
				if(this.schema[p].computeMethod){
					result[p] = this.schema[p].computeMethod.call(this,raw,result);
				}
				else if(this.schema[p].type == "int" && isFinite(raw)){
					result[p] = parseInt(raw);
				}
                else{
					result[p] = raw;
				}
			}
		}
		return result;
	}
	,setJson : function(obj){
		for(var p in this.schema){
			if(p == 'Meta') continue;
			if(typeof obj[p] != 'undefined'){
				if(typeof obj[p] == 'function'){
					obj[p] = obj[p].call(this.ct);
				}
				var raw = obj[p];
				if(this.schema[p].setMethod){
					raw = this.schema[p].setMethod.call(this,raw,obj,true);
				}
				obj[p] = raw;
			}
		}
		this.schema.tempValue = obj;
		for(var p in this.schema){
			if(p == 'Meta') continue;
			var asset = this.form.findField(p);
			if( asset && asset.setValue && typeof obj[p] != 'undefined'){
				if(asset.getXTypes().indexOf('/combo')>0 ){	
					if(asset.mode == 'remote'){
						asset.store.load();
					}else{
						asset.setValue(obj[p]);
						var rowNum = asset.store.find(asset.valueField,obj[p]);
						if(rowNum >= 0){
							var record = asset.store.getAt(rowNum);
							//Ext.dump(record);
							asset.fireEvent('select',asset,record,rowNum);
						}
					}					
				}else{
					asset.setValue(obj[p]);
				}
			}
		}
	}
});
Ext.reg('schemaformpanel',ace.xform.SchemaFormPanel);

/**
 * @class Ext.data.DynParam
 * 动态参数, 作为方法参数的时候会动态产生值
 * @param {Function} 函数
 * @param {Object} (optional) 函数的作用域
 */
Ext.data.DynParam = function(fn,scope){
	this.isDynParam = true;
	this.fn = fn;
	this.scope = scope;
	this.getValue = function(){
		return this.fn.call(this.scope||this);
	};
};
Ext.data.AjaxProxy = function(pluginEname,method,args,isAdmin,extraCallback,extraScope){
    Ext.data.AjaxProxy.superclass.constructor.call(this);
	this.pluginEname = pluginEname;
    this.method = method;
    this.args = args || {};
	this.isAdmin = isAdmin;
    this.cb = null;
    this.reader = null;   
	this.extraCallback = extraCallback;
	this.extraScope = extraScope;
};
Ext.extend(Ext.data.AjaxProxy, Ext.data.DataProxy, {
    load : function(params, reader, callback, scope, arg){		
        if(this.fireEvent("beforeload", this, params) !== false) { 
            var args = [].concat(this.args);     //clone.
			for(var i=0;i < args.length;i++){
				var a = args[i];
				if(a.isDynParam){
					args[i] = a.getValue();
				}
			}
            if(params.sort) { 
				args[args.length-1] = params.sort + " " + params.dir;	//assume the last one is sort.
            }                       
            if(params.start >= 0 && params.limit >= 0) {
                args.push( ( Math.ceil( (params.start+1) / params.limit) ) );
                args.push( params.limit);
            }            
            this.cb = { callback:callback,scope:scope,arg:arg };
            this.reader = reader;
	    this.proxy = this;
	    ace.core.callRemoteMethod(this.pluginEname
					,this.method
					,args
					,this.responseHandler.createDelegate(this)
					,this.errorHandler.createDelegate(this),this.isAdmin);
                     
        }else{
            callback.call(scope||this, null, arg, false);
        }
    },
    responseHandler : function(Result) {
		var proxy = this.proxy;
		var result;
		if(Result instanceof Array){			
			try {				
				result = proxy.reader.readRecords(Result);				
			}catch(e){
				this.fireEvent("loadexception", this, this.cb.arg, null, e);
				proxy.cb.callback.call(proxy.cb.scope, null, proxy.cb.arg, false);
				return;
			}
		}else if(Result.RecordCount > 0) {			
	        var pagingData = {
	            topics : Result.DataList,
	            totalCount : Result.RecordCount
	        };				        
			if(pagingData.topics.length > 0){
				try {					
					result = proxy.reader.readRecords(pagingData);
				}catch(e){
					this.fireEvent("loadexception", this, this.cb.arg, null, e);
					proxy.cb.callback.call(proxy.cb.scope, null, proxy.cb.arg, false);
					return;
				}
			}else{
				result = [];
			}
            
	    }else{
			result = {
				records : [],
				totalRecords : 0
			};			
		}
		proxy.cb.callback.call(proxy.cb.scope, result, proxy.cb.arg, true);
		if(proxy.extraCallback )
			proxy.extraCallback.call(proxy.extraScope||this,result);		
    },
    errorHandler : function(Result) {
		if(Result && Result.message){
			Ext.MessageBox.show({
			   title: '服务端错误',
			   msg: Result.message,
			   buttons: Ext.MessageBox.OK,
			   icon: Ext.MessageBox.ERROR
		   });
		}else{
			//Ext.dump(Result);
			alert('服务器故障，请稍候再试或联系系统管理员');
		}
    }
});

Ext.tree.AjaxTreeLoader = function(config){
	Ext.apply(this, config);

	Ext.tree.AjaxTreeLoader.superclass.constructor.call(this);
	this.dataUrl = "Ajax.ashx";
	this.preloadChildren = true;
	this.clearOnLoad = true;
}
Ext.extend(Ext.tree.AjaxTreeLoader,Ext.tree.TreeLoader,{
	ajaxParams:[]
	,MethodName:''
	,pluginEname:''
	,encodeValue:function(parameter) {   
	    if (encodeURIComponent)
			return encodeURIComponent(parameter);
		return escape(parameter);
	}
	,getParams: function(node){
		var args = [].concat(this.ajaxParams);     //clone.
		for(var i=0;i < args.length;i++){
			var a = args[i];
			if(a.isDynParam){
				args[i] = a.getValue();
			}
		}
		var Data = "CallbackMethod=" + this.MethodName + "&";
		var ParmCount = 0;
		args.unshift(this.pluginEname);
		args.push(node.id);
		if (args.length){
			ParmCount = args.length;
			for (var x = 0; x < ParmCount; x++){
				Data +="Parm" + (x+1).toString() + "=" + this.encodeValue(Ext.encode(args[x]).toString()) + '&';
			}
		}
		Data += "CallbackParmCount=" + ParmCount.toString();
		return Data;      
    }
	,processResponse : function(response, node, callback){
        var json = Ext.decode(response.responseText).data;
        try { 
			var o = Ext.decode(json);
            node.beginUpdate();
            for(var i = 0, len = o.length; i < len; i++){
                var n = this.createNode(o[i]);
                if(n){
                    node.appendChild(n);
                }
            }
            node.endUpdate();
            if(typeof callback == "function"){
                callback(this, node);
            }
        }catch(e){
            this.handleFailure(response);
        }
    }
});
ace.core.callRemoteMethod = function(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin){
	if(pluginEname == "SysKernel"){
		ace.core.callRemoteMethods(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin)
	}
	else{
		var isAjax = true
		for(var f in XMLRPCFuns){
			if(f == MethodName){
				func = XMLRPCFuns[f]
				if(typeof func == 'function'){
					MethodName = func(Parameters)	
				}
				else{
					MethodName = func;
				}	
				ace.core.callRemoteMethodx(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin)
				isAjax = false
				break;
			}
		}
		if(isAjax){
			ace.core.callRemoteMethods(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin)
		}		
	}
}

ace.core.callRemoteMethods = function(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin){
	//var Url = (isAdmin?"admin":"") + ".Ajax.ashx";
	var Url = "Ajax.ashx";

	var successCallback = function(form,action){
		var data = Ext.decode(form.responseText).data;		
		Callback(data);
	};
	
	if(!ErrorCallback){
		ErrorCallback = function(errorMsg){
			ace.core.hideLoading();
			Ext.MessageBox.show({
			   title: '发生问题',
			   msg: errorMsg,
			   buttons: Ext.MessageBox.OK,
			   icon: Ext.MessageBox.ERROR
		   });
		};
	}
	var errorCallback = function(ret){		
		if(ret.status == -1){
			ErrorCallback('请求超时，可能是网络故障或服务器忙，<br>请稍候再试或联系系统管理员。');
			return;
		}
		eval("var rs = " + ret.responseText + ';');
		ErrorCallback(rs);
	};
	var encodeValue = function(parameter) {   
	    if (encodeURIComponent)
			return encodeURIComponent(parameter);
		return escape(parameter);
	}
	var Data = "CallbackMethod=" + MethodName + "&";
	var ParmCount = 0;
	Parameters.unshift(pluginEname);
	if (Parameters.length){
		ParmCount = Parameters.length;
		for (var x = 0; x < ParmCount; x++){
			Data +="Parm" + (x+1).toString() + "=" + encodeValue(Ext.encode(Parameters[x]).toString()) + '&';
		}
	}
	Data += "CallbackParmCount=" + ParmCount.toString();


	Ext.Ajax.request({
	   url: Url,
	   success: successCallback,
	   failure: errorCallback,	   
	   params: Data
	});
};

ace.core.callRemoteMethodx = function(pluginEname,MethodName,Parameters,Callback,ErrorCallback,isAdmin){	
	var Url = "/server";
	if(!ErrorCallback){
		ErrorCallback = function(errorMsg){
			ace.core.hideLoading();
			Ext.MessageBox.show({
			   title: '发生问题',
			   msg: errorMsg,
			   buttons: Ext.MessageBox.OK,
			   icon: Ext.MessageBox.ERROR
		   });
		};
	}
	/*
	var errorCallback = function(ret){
		if(ret.status == -1){
			ErrorCallback('请求超时，可能是网络故障或服务器忙，<br>请稍候再试或联系系统管理员。');
			return;
		}
		eval("var rs = " + ret.responseText + ';');
		ErrorCallback(rs);
	};
	var encodeValue = function(parameter) {   
	    if (encodeURIComponent)
			return encodeURIComponent(parameter);
		return escape(parameter);
	}*/
	var getSecKey =function(method,key,timestamp){
		msg = "<"+timestamp+"><"+ method+">";
		var hmac = Crypto.HMAC(Crypto.SHA1, msg, key);
		return Base64.encode(hmac);
	}
	
	var toStdResult =function(rlt){
		stdResult = {"Success":true, "Data":"", "Describe":"done"}
		if(rlt.result != 0){
			stdResult.Success = false;
			stdResult.Describe = rlt.message;			
		}
		else{
			stdResult.Data = rlt["return"];
			stdResult.Describe = rlt.message;	
		}
		return stdResult
	}
	
	params = ""
	if (Parameters.length){
		Count = Parameters.length;
		for (var x = 0; x < Count; x++){
			params += "Parameters["+ x +"]"
			if (x < Count-1){
				params += ","
			}
		}
	}
	else{
		params = "Parameters"
	}
	var d = new Date();
	var timestamp = d.getTime();
	var key = XMLRPCToken.key
	token = {'timestamp':timestamp,
			'access_uuid':XMLRPCToken.uuid,
			'security_hash':getSecKey(MethodName,key,timestamp)}
	var xmlrpc=null;
	try{
		var xmlrpc = importModule("xmlrpc");
	}catch(e){
		reportException(e);
		throw "importing of xmlrpc module failed.";
	}
	
	try{
		callStr = ""
		if(Parameters.length){
			callStr = 'var rslt = service.'+MethodName+'(token,'+ params +');'
		}
		else{
			callStr = 'var rslt = service.'+MethodName+'(token);'
		}
		var service = new xmlrpc.ServiceProxy(Url, [MethodName]);
		eval(callStr);
		rlt = toStdResult(rslt);
		Callback(rlt);
	}catch(e){
		var em;
		if(e.toTraceString){
			em = e.toTraceString();
		}else{
			em = e.message;
		}
		ErrorCallback(em)
	}
	
};
Ext.namespace('Ext.ux.form');

//param config {disableHtml:false}
Ext.form.RichText = function(config){
    Ext.form.RichText.superclass.constructor.call(this, config);
	this.oFCKeditor = null;
	this.oFCKeditorLoaded = false;
	this.FCK = null;
	this.FCK_id = null;
	this.disableHtml = false;
    
	this.tempValue = "";	

	//alert(this.UpFileBase);
};
Ext.extend(Ext.form.RichText, Ext.form.Field,  {
	initComponent :function(){
		if(!this.initialConfig.noAutoResize){
			this.on("render",function(component){			
				component.ownerCt.on("bodyresize",function(ct,width,height){
					var instance = FCKeditorAPI.GetInstance(component.id);
					if(instance){
						component.setSize(width, height);
						instance.Width = width;
						if(height < 300) height = 300;
						instance.Height = height;
					}
				});			
			});
		}
		Ext.form.RichText.superclass.initComponent.call(this);
    }, 
    onRender : function(ct){
		var _instance = this;
		if(!this.el){
            this.defaultAutoCreate = {
                tag: "input", 
				type: 'hidden', 				
                autocomplete: "off"
            };
        }
		Ext.form.RichText.superclass.onRender.call(this, ct);

		this.FCK_id = this.id + '_textarea';
		Ext.DomHelper.insertAfter(this.id,{ 
				tag:"textarea", 
				type:'textarea',
				autocomplete: "off",
				id:this.FCK_id
			}); 
        this.renderEx(this.initialConfig);		
    },	
	renderEx : function(env) {
		var thisObj = this;
		this.disableHtml = env ? env.disableHtml : false; 
		var mode = this.disableHtml ? "None":"Default";
		if(this.oFCKeditor == null) {
			this.oFCKeditor = new FCKeditor( this.FCK_id, this.width || "100%",this.height || "300",mode,"" ) ;	
			this.oFCKeditor.ReplaceTextarea();
			if(!window.richtext_comps) window.richtext_comps = {};
			window.richtext_comps[this.FCK_id] = thisObj;
			window.FCKeditor_OnComplete = function(FCK) {									
				var instance = FCKeditorAPI.GetInstance(FCK.Name);
				
				var ct = window.richtext_comps[FCK.Name];
				ct.FCK = FCK;
				ct.oFCKeditorLoaded = true;
				if(ct.disableHtml) {
					try{
						instance.EditMode = 1;
					}catch (e){
					}					
				}
				try	{
					instance.SetHTML(ct.tempValue,true);
				}catch (e){
				}
				if(ct.UpFileBase){
					FCK.SetUpFileBase(ct.UpFileBase);
				}
			};
		}
	},
	validate:function(value){
		value = this.getValue();		
        if(Ext.isEmpty(value) || value === this.emptyText){ // if it's blank
             if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid(this.blankText);
                 return false;
             }
		} else {
			this.clearInvalid();
			return true;
		}
    },
    initValue : function(){
		this.setValue("");
	},    
    getValue : function(){
		if(this.rendered){
			if(this.oFCKeditorLoaded){
				var v = window.FCKeditorAPI.GetInstance(this.FCK_id).GetXHTML(false);   
				Ext.get(this.id).dom.value = v;
				return v;
			}
			return "";
        }
        return "";
    },

    setValue : function(v){  
        if(this.rendered){
            this.tempValue = v;
			if(this.oFCKeditorLoaded) window.FCKeditorAPI.GetInstance(this.FCK_id).SetHTML(v);
        }
    }
});
Ext.reg("richtext",Ext.form.RichText);
Ext.ux.form.StaticTextField = function(config){
    this.name = config.name || config.id;
    Ext.ux.form.StaticTextField.superclass.constructor.call(this, config);
};

Ext.form.AttachUploader = function(config){
    Ext.form.AttachUploader.superclass.constructor.call(this, config);
	this.assetPrefix = config.assetPrefix;
	this.initialValue = config.initialValue;
};
//文件上传
Ext.extend(Ext.form.AttachUploader,Ext.form.Field, {
	/**
     * @cfg {String} mediaType 媒体类型, 默认是 image, 其他的有 media attachment
     */
	mediaType:"image"
	,addIframeSrcTail : function(iframeSrc){
		switch(this.mediaType){
			case "image":
				iframeSrc += "&IsAttachment=0";
				break;
			case "media":
				iframeSrc += "&IsMedia=1";
				break;
			default:
				iframeSrc += "&IsAttachment=1";		//附件形式			
		}		
		return iframeSrc;
	}
	,onRender : function(ct){	
		if(!this.el){
            this.defaultAutoCreate = {
                tag: "input", 
				type: 'hidden', 				
                autocomplete: "off"
            };
        }
		var thisObj = this;	
		var iframeSrc = Env.RootURL + "/Plugins/SysKernel/UserControls/IFrameUploadPicture.aspx?fldname=" + this.id;
		iframeSrc = this.addIframeSrcTail(iframeSrc);
		var s = "<input type='hidden' id='HiddenImg_" + this.id + "'/>" +
			"<iframe id='Upload_" + this.id + "' src='" + iframeSrc + "' height='" + this.height + "' width='" + this.width + "' frameborder='0' scrolling='no'></iframe>";			
		ct.dom.innerHTML = s;
		Ext.get('HiddenImg_' + this.id).dom.onchange = function(el,e){
			alert(Ext.get('HiddenImg_' + this.id).dom.value);
		};
		Ext.form.AttachUploader.superclass.onRender.call(this, ct);	
	}
	,initValue : function() {
		if(this.initValue)
			this.setValue(this.initValue);
	}
	,setValue : function(v){ 
		if(this.rendered){
			var obj;
			//if(v && v.length > 0 && v.substr(0,1) == '{'){
			if(v && v.length > 0 ){
				obj = {url:v,oldname:""};
			}else{
				obj = {url:"",oldname:""};
			}
			Ext.get(this.id).dom.value = obj.url;
			Ext.get('HiddenImg_' + this.id).dom.value = (obj.url);
			var src = Env.RootURL + "/Plugins/SysKernel/UserControls/IFrameUploadPicture.aspx?fldname=" + this.id;
			if(obj.url && obj.url.length > 0){
				src += "&url=" + escape(obj.url) + "&oldname=" + escape(obj.oldname);	
			}
			src = this.addIframeSrcTail(src);
			new Ext.util.DelayedTask(function(){
				Ext.get("Upload_" + this.id).dom.src = src;
			}.createDelegate(this)).delay(500);
		}
	}
	,validateValue : function(value){
        if(value.length < 1 || value === this.emptyText){ // if it's blank
             if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid(this.blankText);
                 return false;
             }
		} else {
			return true;
		}
    }
	,getRawValue : function(){
        if(this.rendered){
			var url = Ext.get(this.id).dom.value;
			if(url && url.length > 0){
				//return "{url:'" + url + "',oldname:'" + Ext.get("labelOrginName_" + this.id).dom.innerHTML + "'}";
				//return "{url:'" + url + "'}";
				return url;
			}
		}
		return "";
    }
	,getValue : function(){
		return this.getRawValue();
	}
});
Ext.reg("attachuploader",Ext.form.AttachUploader);

Ext.form.NetFileUploadField = Ext.extend(Ext.form.Field,  {
    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    browseBtnText: 'Browse...',	

	uploadBtnText:'Upload',
    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited TextField members will still be available.
     */
    buttonOnly: false,
    /**
     * @cfg {Number} buttonOffset The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonOffset: 3,
    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true,
    
    /**
     * @hide 
     * @method autoSize
     */
    autoSize: Ext.emptyFn,

	mediaType:"image",

	addIframeSrcTail : function(iframeSrc){
		switch(this.mediaType){
			case "image":
				iframeSrc += "&IsAttachment=0";
				break;
			case "media":
				iframeSrc += "&IsMedia=1";
				break;
			default:
				iframeSrc += "&IsAttachment=1";		//附件形式			
		}
		return iframeSrc;
	},
    
    // private
    initComponent: function(){
        Ext.form.NetFileUploadField.superclass.initComponent.call(this);
        
        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.form.NetFileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
		this.addListener('change',function(){alert("change")},this);
    },
    
    // private
    onRender : function(ct, position){
        Ext.form.NetFileUploadField.superclass.onRender.call(this, ct, position);
        
        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        
		/* 创建一个div来装Iframe,由样式x-form-file控制定位 */
		this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: this.name||this.getId(),
            cls: 'x-form-file',
            tag: 'div'
        });
		/* 创建显示图片的div,由样式x-form-file-img控制定位 */
		this.imgFile = this.wrap.createChild({
            id: this.getImgFileId(),
			name: this.getImgFileId(),
            cls: 'x-form-file-img',
            tag: 'div'
        });  
		var browseBtnCfg = Ext.applyIf(this.browseButtonCfg || {}, {
            text: this.browseBtnText
        });
        this.browseBtn = new Ext.Button(Ext.apply(browseBtnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (browseBtnCfg.iconCls ? ' x-btn-icon' : '')
        }));
        this.browseBtn.on('click', function(){
			Ext.get(this.id+'fileupload').dom.click()
        }, this);

        var deleteBtnCfg = Ext.applyIf(this.deleteButtonCfg || {}, {
            text: "delete"
        });
        this.deleteBtn = new Ext.Button(Ext.apply(deleteBtnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (deleteBtnCfg.iconCls ? ' x-btn-icon' : '')
        }));
        this.deleteBtn.on('click', function(){
			this.setText("");
			this.clearIcon();
            this.browseBtn.enable();
            this.deleteBtn.hide();
            this.uploadBtn.show();
        }, this);

		var uploadBtnCfg = Ext.applyIf(this.uploadButtonCfg || {}, {
            text: this.uploadBtnText			
        });
        this.uploadBtn = new Ext.Button(Ext.apply(uploadBtnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (uploadBtnCfg.iconCls ? ' x-btn-icon' : '')
        }));
        this.uploadBtn.on('click', function(){
			var files = Ext.get(this.id+'fileupload').dom.files;
			var instance = this
			
			if (files.length > 0)
            {
				instance.browseBtn.disable();
                var file = files[0];
                
                // try sending
                var reader = new FileReader();
                
                reader.onloadstart = function() {
                    console.log("onloadstart");                    
					//document.getElementById("bytesTotal").textContent = file.size;
                }
                
                reader.onprogress = function(p) {
                    console.log("onprogress");
                    //document.getElementById("bytesRead").textContent = p.loaded;
                }
                
                reader.onload = function() {
                    console.log("load complete");
                }
                
                reader.onloadend = function() {
                    if (reader.error) {
                        console.log(reader.error);
						instance.browseBtn.enable();
                    } else {
                        //document.getElementById("bytesRead").textContent = file.size;
                        var xhr = new XMLHttpRequest();
                        xhr.open(/* method */ "POST", /* target url */ "/image" /*, async, default to true */);
                        xhr.overrideMimeType("application/octet-stream");
                        xhr.sendAsBinary(reader.result);
                        
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState == 4) {
                                if (xhr.status == 200) {
                                    console.log("upload complete");
                                    console.log("response: " + xhr.responseText);
									var data = Ext.decode(xhr.responseText).data;
									if(data.Success){
										instance.setValue(data.KernelMessage);
									}
									else{
										instance.setText(data.Describe);
										instance.browseBtn.enable();
									}									
                                }
                            }
                        }
						instance.deleteBtn.show();
						instance.uploadBtn.hide();
                    }                    
                }                
                reader.readAsBinaryString(file);
            }
            else
            {
                alert ("Please choose a file.");
            }
            
        }, this);       
        
        if(this.buttonOnly){
            this.el.hide();
            this.wrap.setWidth(this.button.getEl().getWidth());
        }
        
        this.fileInput.on('change', function(){
            var v = Ext.get(this.id+'fileupload').dom.value;
            this.setText(v);
            this.fireEvent('fileselected', this, v);
        }, this);

		var bw =  this.browseBtn.getEl().getWidth();
		var uw =  this.uploadBtn.getEl().getWidth();

		var btnwidth = bw + uw + this.buttonOffset*2;

		var iframeSrc = "ftp.html";

		var html = "<div style='width:"+bw+"px;overflow:hidden;margin-left:"+uw+"px'><input type='file' id='"+this.id+"fileupload' style='width:"+bw+"px;height:22px;float:left;' /></div>";
		
		/*var html ="<input type='hidden' id='HiddenImg_" + this.id + "'/>" +
				"<iframe id='Upload_" + this.id + "' src='" + iframeSrc + "' height='22' width='" + btnwidth + "' frameborder='0' scrolling='no'></iframe>";		*/

		this.fileInput.dom.innerHTML = html;

    },
    
    // private
    getFileInputId: function(){
        return this.id+'-file';
    },
	getImgFileId: function(){
        return this.id+'-img';
    },
	getUploadBtnId:function(){
		return this.id+'-UploadBtn';
	},
	getDeleteBtnId:function(){
		return this.id+'-DeleteBtn';
	},
    
    // private
    onResize : function(w, h){
        Ext.form.NetFileUploadField.superclass.onResize.call(this, w, h);
        
        this.wrap.setWidth(w);		

		var bw =  this.browseBtn.getEl().getWidth();
		var uw =  this.uploadBtn.getEl().getWidth();

		var btnwidth = bw + uw + this.buttonOffset*2;
		
		/* 设置浏览按钮右边的偏移量，右边放置删除或上传按钮 */
		this.browseBtn.getEl().setRight(uw + this.buttonOffset); 
        
        if(!this.buttonOnly){
            var w = this.wrap.getWidth() - btnwidth;
            this.el.setWidth(w);
			this.wrap.setHeight(130);
        }
    },
    
    // private
    preFocus : Ext.emptyFn,
    
    // private
    getResizeEl : function(){
        return this.wrap;
    },

    // private
    getPositionEl : function(){
        return this.wrap;
    },

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    } 
	,initValue : function() {
		if(this.initValue)
			this.setValue(this.initValue);
	}
	
	,validateValue : function(value){
        if(value.length < 1 || value === this.emptyText){ // if it's blank
             if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid(this.blankText);
                 return false;
             }
		} else {
			return true;
		}
    }
	,setText:function(v){
		if(this.rendered){
			Ext.get(this.id).dom.value = v;
		}
	}
	,clearIcon:function(){
		this.imgFile.dom.innerHTML = "";
	}
	,setValue : function(v){ 
		if(this.rendered){
			var obj;
			//if(v && v.length > 0 && v.substr(0,1) == '{'){
			if(v && v.length > 0 ){
				obj = {url:v,oldname:""};
				var imghtm = "<img src='" + v + "' />";
				this.imgFile.dom.innerHTML = imghtm;
			}else{
				obj = {url:"",oldname:""};
			}
			Ext.get(this.id).dom.value = obj.url;
		}
	}
	,getRawValue : function(){
        if(this.rendered){
			var url = Ext.get(this.id).dom.value;
			if(url && url.length > 0){
				//return "{url:'" + url + "',oldname:'" + Ext.get("labelOrginName_" + this.id).dom.innerHTML + "'}";
				//return "{url:'" + url + "'}";
				return url;
			}
		}
		return "";
    }
	,getValue : function(){
		return this.getRawValue();
	}
	,reset : function(){
        Ext.form.NetFileUploadField.superclass.reset.call(this);
        this.applyEmptyConfig();
    }
	,applyEmptyConfig:function(){
		this.uploadBtn.setText(this.uploadBtnText);
		this.browseBtn.enable();
		this.imgFile.dom.innerHTML = "";
	}
});
Ext.reg('netfileuploadfield', Ext.form.NetFileUploadField);

Ext.extend(Ext.ux.form.StaticTextField, Ext.BoxComponent,  {	
    /**
     * @cfg {Function} renderer optional 渲染器，这是一个"afterSetValue"的插入过程,函数参数是 rawValue
     */
	/**
     * @cfg {String/Object} autoCreate A DomHelper element spec, or true for a default element spec (defaults to
     * {tag: "div"})
     */
    defaultAutoCreate : {tag: "div"},
    /**
     * @cfg {String} fieldClass The default CSS class for the field (defaults to "x-form-field")
     */
    fieldClass : "x-form-text",
    // private
    isFormField : true,
    /**
     * @cfg {Boolean} postValue True to create a hidden field that will post the field's value during a submit
     */
    submitValue : false,
    /**
     * @cfg {Mixed} value A value to initialize this field with.
     */
    value : undefined,
    /**
     * @cfg {Boolean} disableReset True to prevent this field from being reset when calling Ext.form.Form.reset()
     */
    disableReset: false,
    // private
    field: null,
    /**
     * Returns the name attribute of the field if available
     * @return {String} name The field name
     */
    getName: function(){
         return this.name;
    },
    // private
    onRender : function(ct, position){
        Ext.ux.form.StaticTextField.superclass.onRender.call(this, ct, position);
        if(!this.el){
            var cfg = this.getAutoCreate();
            this.el = ct.createChild(cfg, position);
        
            if (this.submitValue) {
                this.field = ct.createChild({tag:'input', type:'hidden', name: this.getName(), id: ''}, position);
            }
        }

        this.el.addClass([this.fieldClass, this.cls, 'ux-form-statictextfield']);
        this.initValue();
    },
    // private
    afterRender : function(ct, position){
        Ext.ux.form.StaticTextField.superclass.afterRender.call(this);
        this.initEvents();
    },
    // private
    initValue : function(){
        if(this.value !== undefined){
            this.setValue(this.value);
        }else if(this.el.dom.innerHTML.length > 0){
            this.setValue(this.el.dom.innerHTML);
        }
    },
    /**
     * Returns true if this field has been changed since it was originally loaded.
     */
    isDirty : function() {
        return false;
    },
    /**
     * Resets the current field value to the originally-loaded value
     * @param {Boolean} force Force a reset even if the option disableReset is true
     */
    reset : function(force){
        if(!this.disableReset || force === true){
            this.setValue(this.originalValue);
        }
    },
    // private
    initEvents : function(){
        // reference to original value for reset
        this.originalValue = this.getRawValue();
    },
    /**
     * Returns whether or not the field value is currently valid
     * Always returns true, not used in StaticTextField.
     * @return {Boolean} True
     */
    isValid : function(){
        return true;
    },
    /**
     * Validates the field value
     * Always returns true, not used in StaticTextField.  Required for Ext.form.Form.isValid()
     * @return {Boolean} True
     */
    validate : function(){
        return true;
    },
    processValue : function(value){
        return value;
    },
    // private
    // Subclasses should provide the validation implementation by overriding this
    validateValue : function(value){
        return true;
    },
    /**
     * Mark this field as invalid
     * Not used in StaticTextField.   Required for Ext.form.Form.markInvalid()
     */
    markInvalid : function(){
        return;
    },
    /**
     * Clear any invalid styles/messages for this field
     * Not used in StaticTextField.   Required for Ext.form.Form.clearInvalid()
     */
    clearInvalid : function(){
        return;
    },
    /**
     * Returns the raw field value.
     * @return {Mixed} value The field value
     */
    getRawValue : function(){
       return (this.rendered) ? this.value : null;
    },
    /**
     * Returns the clean field value.
     * @return {String} value The field value
     */
    getValue : function(){
        return this.getRawValue();
    },
    /**
     * Sets the raw field value. The display text is <strong>not</strong> HTML encoded.
     * @param {Mixed} value The value to set
     */
    setRawValue : function(v){
		if(typeof this.renderer != 'undefined') v = this.renderer(v);
		if(typeof v == 'undefined') v = '';
        this.value = v;
        if(this.rendered){
            this.el.dom.innerHTML = v;
            if(this.field){
                this.field.dom.value = v;
            }
        }
    },
    /**
     * Sets the field value. The display text is HTML encoded.
     * @param {Mixed} value The value to set
     */
    setValue : function(v){
		if(typeof this.renderer != 'undefined') v = this.renderer(v);
		if(typeof v == 'undefined') v = '';
        this.value = v;
        if(this.rendered){
            this.el.dom.innerHTML = Ext.util.Format.htmlEncode(v);
            if(this.field){
                this.field.dom.value = v;
            }
        }
    }
});
Ext.reg('statictextfield', Ext.ux.form.StaticTextField);

Ext.override(Ext.form.TextField, {
    initComponent : function(){
        if (this.maxLength!=Number.MAX_VALUE && !this.autoCreate) {
            this.autoCreate = Ext.apply(this.getAutoCreate, {maxlength:this.maxLength});
        }
        Ext.form.TextField.superclass.initComponent.call(this);
        this.addEvents(
            'autosize'
        );
    }
});
/**
 * @class Ext.form.SimpleComboBox
 * @extends Ext.form.ComboBox
 * 简单的本地存储下拉框控件
 * @constructor
 * Create a new SimpleComboBox.
 * @param {Object} config Configuration options
 */
Ext.form.SimpleComboBox = Ext.extend(Ext.form.ComboBox,{	
	/**
	 * @cfg {String} domainName optional. 对象的名称,用于构成"请选择{0}"这个标题
	 */
	/**
	 * @cfg {Array} storeData 数据数组(二维),构成如: [['已批准','1'],['未批准','0']]
	 */
	/**
	 * @cfg {Array} banner optional. 标题, 如果提供这个,一般是当前用在筛选控件的情况,如 ['全部','-1']
	 */
	/**
	 * @cfg {Function} selectHandler optional.选择数据后的回调方法
	 */
	/**
	 * @cfg {Object} scope optional.如果提供了回调方法, 方法的作用域是什么
	 */
	initComponent : function(){
		Ext.form.SimpleComboBox.superclass.initComponent.call(this);
		
		var commonConfig = {
			editable:false
			,lazyInit:false
			,triggerAction: 'all'
			,emptyText:'请选择' + (this.domainName || "")
			,mode:'local'
			,displayField:'text'
			,valueField:'value'	
			,hiddenName:this.name
		};		
		if(typeof this.storeData == 'string' && this.storeData.substring(0,1) == '['){
			this.storeData = Ext.decode(this.storeData);
		}
		var data = this.storeData;
		if(!Ext.isEmpty(this.banner) && this.banner instanceof Array){
			data = [this.banner].concat(data);
			Ext.apply(commonConfig,{
				value:this.banner[1]
			});
		}
		Ext.apply(commonConfig,{			
			store:new Ext.data.SimpleStore({
				data:data
				,fields:['text','value']
			})
		});		
		if(this.selectHandler){
			this.on('select', this.selectHandler, this.scope || this); 
		}
		Ext.applyIf(this.initialConfig,commonConfig);
		Ext.apply(this,this.initialConfig);
	}
});
Ext.reg('simplecombo',Ext.form.SimpleComboBox);
/**
 * @class Ext.form.SchemaComboBox
 * @extends Ext.form.ComboBox
 * A combobox control with support for easy dropdown features.
 * @constructor
 * Create a new SchemaComboBox.
 * @param {Object} config Configuration options
 */
Ext.form.SchemaComboBox = Ext.extend(Ext.form.ComboBox,{
	/**
	 * @cfg {String} linkSchema required.关联的schema的名称(即原生函数的名称), 注意，这个跟控件所在的formpanel在render时附加的schema不一定一样的。
	 *  比如 PluginId, 在formpanel中在render后附加了AppCatalogSupport.M.WebTemplate 这个schema，但实际上它是关联到 Plugin 这个schema的
	 *  关联schema的实体是共享的，所以不能在关联schem的实体中保存状态
	 */
	/**
	 * @cfg {Object} schemaEnv optional. 定义本控件时的宿主的原生函数传入的环境参数，如 AppCatalogSupport.M.WebTemplate(Env) 中的 Env对象
	 */
	/**
	 * @cfg {String} readMethod optional. 读取列表对象的函数名，如果不提供，则默认为 Read + domainName + Page
	 */
	/**
	 * @cfg {Function} onStoreLoaded optional. 读取记录集后的额外动作，比如插入一条额外数据，签名为: (Store this, Ext.data.Record[] records)
	 */
	/**
	 * @cfg {Array} extraFlds optional. 对象的其他字段，比如 Catalog的Parentid
	 */
	/**
	 * @cfg {Array} methodArgs required. 读取列表对象的函数参数列表
	 */
	/**
	 * @cfg {String} triggerFld optional. 选择项修改后要触发其他的控件的名称，本控件所在的schema内
	 */
	/**
	 * @cfg {Boolean} returnText optional. 是否 getValue 返回文本
	 */
	preprocess : function(){
		if(this.methodArgs && typeof this.methodArgs == 'string' && this.methodArgs.substring(0,1) == '['){
			this.methodArgs = Ext.decode(this.methodArgs);
		}
	},
	initComponent : function(){
		if(!this.linkSchema) alert("lack of linkSchema config");	
		Ext.form.SchemaComboBox.superclass.initComponent.call(this);

		this.preprocess();
		
		if(null == Ext.form.SchemaComboBox.schemaCache){
			Ext.form.SchemaComboBox.schemaCache = {};
		}		
		var linkSchemaEntity = Ext.form.SchemaComboBox.schemaCache[this.linkSchema];
		if(null == linkSchemaEntity){
			eval('var linkSchemaGenFn=' + this.linkSchema + ';');
			linkSchemaEntity = linkSchemaGenFn.call(this, this.schemaEnv);
			Ext.form.SchemaComboBox.schemaCache[this.linkSchema] = linkSchemaEntity;
		}
		var dispField = this.displayField;
		if(Ext.isEmpty(dispField) && !Ext.isEmpty(linkSchemaEntity.Meta.titleFld)){
			dispField = linkSchemaEntity.Meta.titleFld;
		}
		var valueField = this.valueField || ace.core.getIdentityField(linkSchemaEntity);
		var commonConfig = {
			resizable:true
			,editable:false
			,lazyInit:false
			,triggerAction: 'all'
			,emptyText:'请选择' + linkSchemaEntity.Meta.Description
			,mode:'remote'
			,forceSelection:true
			,queryDelay:100	
			,displayField:dispField
			,valueField:valueField
			,hiddenName:this.name
		};			
		var allFlds = [valueField,dispField];
		if(this.extraFlds != null && this.extraFlds.length > 0)
			allFlds = allFlds.concat(this.extraFlds);		

		var ns = linkSchemaEntity.Meta.ns;
		if(!this.store && Ext.isEmpty(ns)) alert('linkSchema '+ this.linkSchema +' lack of meta.ns property.');		
		if(!this.store & !this.storeCfg){
			var arrNs = ns.split('.');
			var methodName;
			var args = this.methodArgs;	
			if(Ext.isEmpty(this.readMethod)){
				if(linkSchemaEntity.Meta.applyXsmile){
					methodName = "ReadDataPage";
					args.unshift(linkSchemaEntity.Meta.secretScript == true);
					args.unshift(arrNs[arrNs.length-1]);
				}else{
					methodName = "Read" + arrNs[arrNs.length-1] + "Page";
				}
			}else{
				methodName = this.readMethod;
			}						
			Ext.apply(commonConfig,{
				storeCfg:{
					fn: function(cfg){
						return ace.xform.createAjaxDs(cfg);
					}
					,args:{
						asset:this.name
						,pluginEname:arrNs[0]
						,method:methodName
						,args:args
						,allFlds:allFlds
						,identFld:valueField
					}
				}
			});		
		}
		Ext.applyIf(this.initialConfig,commonConfig);
		Ext.apply(this,this.initialConfig);

		if(!Ext.isEmpty(this.triggerFld)){
			this.on('select',function(comp,r){
				var targetFld = comp.schema[comp.triggerFld];
				if(Ext.isEmpty(targetFld)){
					targetFld = comp.schema.Meta[ace.xform.Const_OtherFields][comp.triggerFld];
				}
				var target = Ext.getCmp(targetFld.id);
				if(target.store) target.store.load();
			},this);
		}
		if(!this.store){
			this.store = this.storeCfg.fn.call(this.schema, this.storeCfg.args);
			this.store.scope = this;

			this.store.on('load',function(s,r){			
				var comp = this.scope;
				//Ext.dump(comp.hiddenName + '.load');
				
				var fn = function(){				
					if(!Ext.isEmpty(comp.schema) && !Ext.isEmpty(comp.schema.tempValue)){
						var v = comp.schema.tempValue[comp.name];
						comp.setValue(v);
						if(!comp.view){
							comp.initList();
						}
						if(!comp.selectByValue(v)){
							comp.clearValue();
						}else{						
							comp.fireEvent('select',comp,{data:v});
						}					
					}
				};
				if(comp.onStoreLoaded){
					comp.onStoreLoaded.call(this,r,fn);				
				}else{
					fn();
				}
			});			
		}
	}
	,loadData:function(){
		this.store.load();
	}

});
Ext.reg("schemacombo",Ext.form.SchemaComboBox);	  

Ext.form.TextFieldWithButton = Ext.extend(Ext.form.TextField,  {
    
    buttonText: '...',
    
    buttonOnly: false,
   
    buttonOffset: 3,
    
    // private
    readOnly: false,
    
   
    autoSize: Ext.emptyFn,
    
    // private
    initComponent: function(){
        Ext.form.TextFieldWithButton.superclass.initComponent.call(this);

        this.addEvents(            
            'buttonClicked'
        );
    },
    
    // private
    onRender : function(ct, position){
        Ext.form.TextFieldWithButton.superclass.onRender.call(this, ct, position);
        
        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
               
        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text: this.buttonText
        });
        this.button = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
        }));
        
        if(this.buttonOnly){
            this.el.hide();
            this.wrap.setWidth(this.button.getEl().getWidth());
        }

		this.button.on('click', function(){
			var v = this.el.getValue();
			this.fireEvent('buttonClicked', this, v);            
        }, this);      
    },
    
    // private
    getFileInputId: function(){
        return this.id+'-file';
    },
    
    // private
    onResize : function(w, h){
        Ext.form.TextFieldWithButton.superclass.onResize.call(this, w, h);
        
        this.wrap.setWidth(w);
        
        if(!this.buttonOnly){
            var w = this.wrap.getWidth() - this.button.getEl().getWidth() - this.buttonOffset;
            this.el.setWidth(w);
        }
    },
    
    // private
    preFocus : Ext.emptyFn,
    
    // private
    getResizeEl : function(){
        return this.wrap;
    },

    // private
    getPositionEl : function(){
        return this.wrap;
    },

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }
    
});
Ext.reg('textfieldwithbutton', Ext.form.TextFieldWithButton);

Ext.form.MultiSelectField = Ext.extend(Ext.form.TextField,  {
    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    buttonText: '...',
    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited TextField members will still be available.
     */
    buttonOnly: false,
    /**
     * @cfg {Number} buttonOffset The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonOffset: 3,
    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true,
    
    /**
     * @hide 
     * @method autoSize
     */
    autoSize: Ext.emptyFn,

	currentValue:'',
    
    // private
    initComponent: function(){
        Ext.form.MultiSelectField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.form.MultiSelectField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
    },
    
    // private
    onRender : function(ct, position){
        Ext.form.MultiSelectField.superclass.onRender.call(this, ct, position);	
        
        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
       
        
		/*
		 this.el.dom.removeAttribute('name');
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: this.name||this.getId(),
            cls: 'x-form-file',
            tag: 'input', 
            type: 'text',
            size: 1
        });*/
        
        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text: this.buttonText
        });
        this.button = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
        }));

        this.button.on('click', function(){
			var w = new Ext.form.MultiSelectWindow(this,{"nameSpace":this.nameSpace,"filterArgs":this.filterArgs});
            w.open(this.linkField);
        }, this);
        
        if(this.buttonOnly){
            this.el.hide();
            this.wrap.setWidth(this.button.getEl().getWidth());
        }
		if(this.hidden)
			this.hideParent();
        /*
		ownerCt
        this.fileInput.on('change', function(){
            var v = this.fileInput.dom.value;
            this.setValue(v);
            this.fireEvent('fileselected', this, v);
        }, this);*/
    },
    
    // private
    getFileInputId: function(){
        return this.id+'-file';
    },
    setMutiField:function(v){
        if(this.rendered){
			this.currentValue = v;
			Ext.get(this.id).dom.value = v[this.linkField + 'ID'];
		}
    },
    // private
    onResize : function(w, h){
        Ext.form.MultiSelectField.superclass.onResize.call(this, w, h);
        
        this.wrap.setWidth(w);
        
        if(!this.buttonOnly){
            var w = this.wrap.getWidth() - this.button.getEl().getWidth() - this.buttonOffset;
            this.el.setWidth(w);
        }
    },
    
    // private
    preFocus : Ext.emptyFn,
    
    // private
    getResizeEl : function(){
        return this.wrap;
    },

    // private
    getPositionEl : function(){
        return this.wrap;
    },

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }
    
});
Ext.reg('multiselectfield', Ext.form.MultiSelectField);

Ext.form.MultiSelectWindow = function(module,cfg){
	this.ct = module;
	Ext.apply(this,cfg);
}

Ext.form.MultiSelectWindow.prototype ={
	uniqueKey:Ext.id()
	,title:'MultiSelect'
	,nameSpace:"SysKernel"
	,filterArgs:{}
	,dialog:null
	,MultiSelectGrid:null
	,getSchema:function(){
		var _instance = this;
		return {
			Meta : {
				Description : '多选项'
				,ns:_instance.nameSpace + ".M.MultiSelect"
				,titleFld:'text'
				,secretScript:true
			}
			,value : {
				label:"自动编号"
				,asset:{
					xtype:'hidden'
				}
				,identity:true
			}
			,text : {
				label:"Items"
				,asset:{
					xtype:'hidden'
				}
			}		
		}
	}
	,getPagerGrid:function(key){
		var _instance = this;
		if(!this.MultiSelectGrid){
			var schema = this.getSchema();
			this.MultiSelectGrid = new ace.xform.PagerGridPanel({
				schema:schema
				,pageSize:1000
				,singleSelect:false
				,showFlds:[
					{width: 2, dataIndex: 'value',hidden:true }
					,{width: 2, dataIndex: 'text' }
				]
				,ajaxParams:[[key,_instance.filterArgs],true]
				,hidePager:true
				,tbars:this.getToolBars()
			});
		}		
		return this.MultiSelectGrid;		
	}
	,getToolBars :function(){
		return null;
	}
	,getLayoutCfg : function(key){
		var _instance = this;
		return {
			items:[{
				region:'center',
				height:450,
				items: _instance.getPagerGrid(key)
			}]	
		}
	}
	,createdialog:function(key){
		if(this.dialog != null)return;
		var _instance = this;
		this.dialog = new Ext.Window(
			Ext.apply(this.getLayoutCfg(key),{
				title:_instance.title
				,layout:"border"
				,bodyBorder:false
				,width:250
				,height:450
				,border:false
				,bufferResize:true
				,defaults:{
					margins:'0 0 0 0'
					,layout:'fit'
					,bodyBorder:false
					,border:false
					,split:true
				}			
				,buttons: [{
					text     : 'Select',
					handler  : function(){
						var rowData = _instance.MultiSelectGrid.getSelections();
						var result = [];
						for(var d in rowData){
							var obj = rowData[d].json;
							if(obj)    
								result.push(obj);
						}
						var arr1 = [];
						var arr2 = [];
						for(var i in result){
							var o = result[i];
							if(typeof o == 'function')continue;
							arr1.push(o.text);
							arr2.push(o.value);
						}
						var obj = new Object();
						obj[key] = arr1.join();
						obj[key+"ID"] = arr2.join();

						_instance.ct.setMutiField(obj);
						_instance.dialog.hide();
					}},{
						text     : 'Close',
						handler  : function(){
							_instance.dialog.hide();
						}
					}]							
				}
			)			
		);
	}
	,open:function(key){
		this.createdialog(key);
		this.dialog.show();
	}
	,getAjaxParams:function(key){
		return {};
	}
}

Ext.form.InputFieldWithComboBox = Ext.extend(Ext.form.TextField,  {
    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    buttonText: '...',
    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited TextField members will still be available.
     */
    buttonOnly: false,
    /**
     * @cfg {Number} buttonOffset The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonOffset: 18,
    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: false,
    
    /**
     * @hide 
     * @method autoSize
     */
    autoSize: Ext.emptyFn,
    
    // private
    initComponent: function(){
        Ext.form.InputFieldWithComboBox.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.form.InputFieldWithComboBox} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
    },
    
    // private
    onRender : function(ct, position){
        Ext.form.InputFieldWithComboBox.superclass.onRender.call(this, ct, position);      

		this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-combo-input-wrap'});
        this.el.addClass('x-form-combo-input-text');		
        
        var comboBoxCfg = Ext.applyIf(this.comboBoxCfg || {}, {			
			typeAhead: true,
			mode: 'local',
			triggerAction: 'all',			
			selectOnFocus:true,
			width:70
        });
		
        this.comboBox = new Ext.form.ComboBox(Ext.apply(comboBoxCfg, {
            renderTo: this.wrap            
        }));

        /*
        this.fileInput.on('change', function(){
            var v = this.fileInput.dom.value;
            this.setValue(v);
            this.fireEvent('fileselected', this, v);
        }, this);*/
    },
    
    // private
    getFileInputId: function(){
        return this.id+'-file';
    },	
    
    // private
    onResize : function(w, h){
        Ext.form.InputFieldWithComboBox.superclass.onResize.call(this, w, h);
        
        this.wrap.setWidth(w);

        if(!this.buttonOnly){
            var w = this.wrap.getWidth() - this.comboBox.getEl().getWidth() - this.buttonOffset;
            this.el.setWidth(w);
        }
    },
    
    // private
    preFocus : Ext.emptyFn,
    
    // private
    getResizeEl : function(){
        return this.wrap;
    },

    // private
    getPositionEl : function(){
        return this.wrap;
    },

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }
    
});
Ext.reg('inputfieldwithCcombobox', Ext.form.InputFieldWithComboBox);

Ext.form.ComboBoxWithInputField = Ext.extend(Ext.form.ComboBox,{
	fieldOffset:18,
	initComponent: function(){
        Ext.form.ComboBoxWithInputField.superclass.initComponent.call(this);        
    },
	onRender : function(ct, position){
        Ext.form.ComboBoxWithInputField.superclass.onRender.call(this, ct, position);      

		/*this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-combo-input-wrap'});
        this.el.addClass('x-form-combo-input-text');*/
        this.el.dom.removeAttribute('name');

		var inputFieldCfg = Ext. applyIf(this.inputfieldCfg || {},{
			selectOnFocus:true,			
			width:100
		});

		this.inputfield = new (this.inputType || Ext.form.TextField)(Ext.apply(inputFieldCfg, {
            renderTo: this.wrap,
			style:'margin-left:20px;'
        }));
    },
	onResize : function(w, h){
        Ext.form.InputFieldWithComboBox.superclass.onResize.call(this, w, h);
        
        this.wrap.setWidth(w);
		var w = w - this.inputfield.getEl().getWidth() - this.fieldOffset;
		this.el.setWidth(w);

    },
    
    // private
    preFocus : Ext.emptyFn,
    
    // private
    getResizeEl : function(){
        return this.wrap;
    },

    // private
    getPositionEl : function(){
        return this.wrap;
    },

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }

});
Ext.reg('comboboxwithInputfield', Ext.form.ComboBoxWithInputField);

Ext.form.AceRadioGroup = Ext.extend(Ext.form.RadioGroup,{
	ready :false
	,initComponent: function(){		
		Ext.form.AceRadioGroup.superclass.initComponent.call(this);	
		this.addEvents(
            'check'
			,'ready'
        );
		var radios = this.items;
		var _instance = this;
		for(var i in radios){
			var o = radios[i];
			if(typeof o != "object")continue;
			o.listeners = {
				'check':function (obj, bool){
					if(_instance.ready && bool)
						_instance.fireEvent("check", obj, obj.inputValue);
				}
			}
		}
    }	
	,onRender : function(ct, position){
		Ext.form.AceRadioGroup.superclass.onRender.call(this, ct, position);
	}  
    ,getValue : function(){
		var radios = this.items.items;
		for(var i in radios){
			var o = radios[i];
			if(typeof o != "object")continue;
			if(o.checked)
				return o.inputValue;
		}
	}
	,getName:function(){
		return this.name;
	}
	
    ,setValue : function(v){
		if(typeof v ==='undefined')return;
		var radios = this.items.items;
		for(var i in radios){
			var o = radios[i];
			if(typeof o != "object")continue;
			o.setValue(o.inputValue == v);
		}
		this.ready = true;
		this.fireEvent("ready",v);
	}    

});
Ext.reg('aceradiogroup', Ext.form.AceRadioGroup);

Ext.form.AceCheckbox = Ext.extend(Ext.form.Checkbox,{
	inputValue:"Y"
    ,getValue : function(){
		if(this.rendered && this.el.dom.checked){
            return "Y"
        }
        return "N";
	}
    ,setValue : function(v){
		var checked = this.checked;
        this.checked = (v === true || v === 'true' || v == 'Y' || v == '1' || String(v).toLowerCase() == 'on');
        
        if(this.el && this.el.dom){
            this.el.dom.checked = this.checked;
            this.el.dom.defaultChecked = this.checked;
        }
        this.wrap[this.checked? 'addClass' : 'removeClass'](this.checkedCls);
        
        if(checked != this.checked){
            this.fireEvent("check", this, this.checked);
            if(this.handler){
                this.handler.call(this.scope || this, this, this.checked);
            }
        }
	}
	,getName:function(){
		return this.name;
	}
});
Ext.reg('acecheckbox', Ext.form.AceCheckbox);

/* 级联的ComboBox */
Ext.form.CascadingComboBox =  Ext.extend(Ext.form.SchemaComboBox,{
	
	parentKey:'@'				/* 该级的父键 */	

	,triggerFld:''              /* 触发的下一级 */

	,isSingle:true

	,extraFlds:['parentKey']    /* 扩展字段，父键 */

	,lds:{topics:[],totalCount:0}

	,methodArgs:[]
	
	,haveAllItem:true

	

	,initComponent: function(){
        Ext.form.CascadingComboBox.superclass.initComponent.call(this);		

		var _instance = this;

		var record = Ext.data.Record.create([
			{name: 'text',type: 'string'},
            {name: 'value',type: 'string'}
		]);

		this.store.on('beforeload',function(s,o){
			if(!_instance.isSingle){
				s.loadData(_instance.lds);
				if(!Ext.isEmpty(_instance.parentKey)){
					s.filter('parentKey',_instance.parentKey,false,false);
					if(_instance.haveAllItem){
						var r  = new record({"text":"All","value":""});
						s.insert(0,r);
					}					
				}
			}
				
			return _instance.isSingle;
		});

		if(!Ext.isEmpty(this.triggerFld)){
			this.on('select',function(comp,r){				
				var target = Ext.getCmp(this.triggerFld);
				if(target){
					target.parentKey = this.getValue();
					target.clearNextLevelValue();
					if(target.store){
						target.store.load();						
					}
					/*target.expand();*/
				}
				
			},this);			
		}
    }
	,clearNextLevelValue:function(){
		this.clearValue();
		if(!Ext.isEmpty(this.triggerFld)){
			var target = Ext.getCmp(this.triggerFld);
			if(target)
				target.clearNextLevelValue();
		}
	}

	,onStoreLoaded:function(s,r,fn){
		if(!Ext.isEmpty(this.triggerFld)){

			for(var n in r){
				var o = r[n];
				if( typeof o == 'function' || !o.json)continue;
				this.lds.topics.push(o.json);
			}
			this.lds.totalCount = r.length-1;

			var target = Ext.getCmp(this.triggerFld);
			if(target.lds)
				 Ext.apply(target.lds,this.lds);
		}
		
		s.filter('parentKey',this.parentKey,true,false);
		fn();
	}	
});

Ext.reg("cascadingcombo",Ext.form.CascadingComboBox);


/* 级联的ComboBox */
Ext.form.ComplexComboBox =  Ext.extend(Ext.form.SchemaComboBox,{
	
	parentKey:'@'				/* 该级的父键 */	

	,triggerFld:[]              /* 触发的下一级 */

	,isSingle:true

	,extraFlds:['parentKey']    /* 扩展字段，父键 */

	,lds:{topics:[],totalCount:0}

	,methodArgs:[]
	
	,haveAllItem:true

	

	,initComponent: function(){
        Ext.form.CascadingComboBox.superclass.initComponent.call(this);
		this.addEvents(            
            'prelevelchangged'
        );

		var _instance = this;

		var record = Ext.data.Record.create([
			{name: 'text',type: 'string'},
            {name: 'value',type: 'string'}
		]);

		this.store.on('beforeload',function(s,o){
			if(!_instance.isSingle){
				s.loadData(_instance.lds);
				if(!Ext.isEmpty(_instance.parentKey)){
					s.filter('parentKey',_instance.parentKey,false,false);
					if(_instance.haveAllItem){
						var r  = new record({"text":"All","value":""});
						s.insert(0,r);
					}					
				}
			}
				
			return _instance.isSingle;
		});

		if(this.triggerFld.length){
			this.on('select',function(comp,r){
				for(var i=0;i<this.triggerFld.length;i++){
					var target = Ext.getCmp(this.triggerFld[i]);
					if(target){
						target.parentKey = this.getValue();
						target.clearNextLevelValue();
						if(target.store){
							target.store.load();						
						}
						/*target.expand();*/
					}
				}
			},this);			
		}
    }
	,clearNextLevelValue:function(){
		this.clearValue();
		if(this.triggerFld.length){
			for(var i=0;i<this.triggerFld.length;i++){
				var target = Ext.getCmp(this.triggerFld[i]);
				if(target)
					target.clearNextLevelValue();
			}			
		}
	}

	,onStoreLoaded:function(s,r,fn){
		if(this.triggerFld.length){

			for(var n in r){
				var o = r[n];
				if( typeof o == 'function' || !o.json)continue;
				this.lds.topics.push(o.json);
			}
			this.lds.totalCount = r.length-1;

			for(var i=0;i<this.triggerFld.length;i++){
				var target = Ext.getCmp(this.triggerFld[i]);
				if(target && target.lds)
					 Ext.apply(target.lds,this.lds);
			}
		}
		
		s.filter('parentKey',this.parentKey,true,false);
		fn();
	}	
});

Ext.reg("complexcombo",Ext.form.ComplexComboBox); 