Ext.define('Ext.ux.desktop.DynParam',{
	constructor:function(fn,scope){
		this.fn = fn;
		this.scope = scope;
	},
	isDynParam : true,	
	getValue : function(){
		return this.fn.call(this.scope||this);
	}
});


Ext.define('Ext.ux.desktop.AjaxProxy', {
	extend: 'Ext.data.proxy.Ajax'
	,requires: ['Ext.data.writer.Json']
	,actionMethods: {
		create : 'POST',
		read   : 'GET',
		update : 'PUT',
		destroy: 'DELETE'
	}
	,extraParams:{}
	,writer:'json'
	,url:"etcd/"
	,reader:{
		root : 'root'
		,idProperty : 'id'
		,totalProperty:'total'
		,successProperty : 'success'
		,messageProperty : 'message'
	}
	,constructor: function (ns, method, args) {
		this.callParent();
		this.getExtraParams(ns, method, args);
	}
	//in a ServerProxy all four CRUD operations are executed in the same manner, so we delegate to doRequest in each case
	,create: function(operation, callback, scope) {
		return this.doRequest(operation, callback, scope);
	}

	,read: function(operation, callback, scope) {
		/*filter = new Ext.util.Filter({
			property: 'age',
			value   : 32
		});
		operation.filters.push(filter);*/
		return this.doRequest(operation, callback, scope);
	}

	,update: function(operation, callback, scope) {
		return this.doRequest(operation, callback, scope);
	}

	,destroy: function(operation, callback, scope) {
		/*if (!operation.filters){
			operation.filters = [];
		}
			
		for(var i=0; i<operation.records.length;i++){
			var record = operation.records[i];
			var idProperty = record.idProperty;
			var record_id = record.data[idProperty];

			var filter = new Ext.util.Filter({
				property: idProperty,
				value   : record_id
			});
			operation.filters.push(filter);
		}*/
		return this.doRequest(operation, callback, scope);
	}
	,getExtraParams:function(ns, method, args){
		var me = this;
		me.url += ns + '/' + method;

		if(!args){
			me.extraParams = {};
			return me.sign();
		}
		
		var params = {};
		for(var i=0;i < args.length;i++){
			var a = args[i];
			if(a.isDynParam){
				a = a.getValue();
			}
			if(a.constructor==Object){
				Ext.apply(params, a);
			}
		}
		me.extraParams = params;
		return me.sign();
	}
	,randomString: function(len) {
		len = len || 10;
		var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
		var maxPos = $chars.length;
		var pwd = '';
		for (i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}
	,sign:function(){
		var me = this;
		var ramstr = me.randomString();
		var txt = ENV['A'] + '/' + me.url + '?' + ramstr;
		
		me.extraParams['_random_'] = ramstr;
		me.extraParams['_user_'] = ENV['U'];
		var arr = [];
		for (var i in me.extraParams){
			if(me.extraParams[i] && (me.extraParams[i].constructor=='String' || me.extraParams[i].constructor=='Number')){
				arr.push(i + '=' + me.extraParams[i].toString());
			}
		}
		// txt += arr.sort().join('&');

		me.extraParams['_txt_'] = txt;
		me.extraParams['_key_'] = hex_md5(txt);
	}
	,listeners:{
		'exception':function(a,b,c,d){
			if (b.responseText.indexOf('GetAccessKey fail') > 0){
				window.location = "/index.html";
			}
		}
	}
});