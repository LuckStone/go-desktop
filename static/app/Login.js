Ext.define('MyDesktop.Login', {
	extend: 'Ext.window.Window'
	,uses:['Ext.Panel','Ext.form.Panel']
	,layout: 'border'
	,id: 'login-win'
	,title: '用户登录'
	,width: 430
	,height: 250
	,minHeight: 250
	,minWidth: 430
	,buttons: []
	,buttonAlign: 'right'
	,closable: false
	,draggable: false
	,keys: {}
	,plain: false
	,resizable: false
	,items: []
	,modal: true
	,border: false
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

		me.buttons = [{
			handler:function(){
				me.showMask();
				this.disable();

				var form = Ext.getCmp(me.form_id);
				
				form.submit({
					reset: true
				});
			},
			text: '登录',
			id:'login_btn'
		}];

		var logoPanel = new Ext.Panel({
			baseCls: 'x-plain',
			id: 'login-logo',
			region: 'center',
			style:'text-align:center;',
			html:'<img id="imgVerify" src="/console/randomcode/1" alt="看不清？点击更换" style="float:none; margin:10px 0;" />'
		});
		
		var formPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			baseParams: {
				module: 'fruit'
			},
			defaults: {
				width: 260
				,labelAlign: 'right'
				,listeners:{
					specialkey:function(field,e){
			            if (e.getKey() == e.ENTER){
			                var form = Ext.getCmp(me.form_id);
					
							form.submit({
								reset: true
							});
			            }  
			      	}
				}
			},
			defaultType: 'textfield',
			frame: false,
			height: 100,
			id: 'login-form',
			items: [{
				fieldLabel: '帐号'
				,name: 'apple'
				,value:'admin'
				,selectOnFocus:true
				,allowBlank:false
				,validateOnBlur:true
				,minLength:4
				,maxLength:30
				,maskRe:new RegExp('[^+-]')
			},{
				fieldLabel: '密码'
				,inputType: 'password'
				,value:''
				,name: 'pear'
				,selectOnFocus:true
				,allowBlank:false
			},{
				fieldLabel: '验证码'
				,name: 'code'
				,selectOnFocus:true
				,allowBlank:false
				,validateOnBlur:true
				,minLength:4
				,maxLength:4
				,maskRe:new RegExp('[^+-]')
			},{
				name: 'random_key'
				,id:'random_key'
				,value:Ext.id()
				,xtype:'hiddenfield'
			}],
			labelWidth:75,
			listeners: {
				'beforeaction':{
					fn:me.onBeforeAction,
					scope:me
				},
				'actioncomplete': {
					fn: me.onActionComplete,
					scope: me
				},
				'actionfailed': {
					fn: me.onActionFailed,
					scope: me
				}
			},
			region: 'south',
			url:  '/console/account//login'
		});
		
		me.items = [logoPanel, formPanel];
		me.form_id = 'login-form';
	}
	,listeners:{
		'show':function(win){
			var formComp = Ext.getCmp(win.form_id);
			var form = formComp.getForm();
			var f = form.findField('user');
			
			if(f){
				f.focus();
			}

			Ext.get('imgVerify').on("click", function(){
				var o = this.dom;
				o.src = o.src + '?';
			});
		}
	}
	
	,onBeforeAction:function(f,a){
		var v = f.getValues();
		v.pear = hex_md5(v.pear);
		f.setValues(v);
	}
	,onActionComplete : function(f, a){
		var me = this;
		me.hideMask();
		if(!(a && a.result))
			return;
		if(a.result.success )
		{
			me.destroy(true);
			
			// get the path
			var path = window.location.pathname,
				path = path.substring(0, path.lastIndexOf('/') + 1);
				
			// set the cookie
			set_cookie('access_key', a.result.KernelMessage.access_key, '', path, '', '' );
			set_cookie('access_uuid', a.result.KernelMessage.access_uuid, '', path, '', '' );
			
			// redirect the window
			window.location = path+"desktop.html";
		}
		else{
			var msg = a.result.message;
			Ext.Msg.show({
			   title:'登录失败',
			   msg: msg,
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.ERROR
			});
		}
	}
	
	,onActionFailed : function(f,a){
		f.reset();
		this.hideMask();
	}
	,hideMask : function(){
		this.body.unmask();
		var btn = Ext.getCmp('login_btn');
		btn.enable();
	}
	,showMask : function(msg){
		this.body.mask({
			'msg': msg || 'Please wait...'
		});
		return;
	}
});