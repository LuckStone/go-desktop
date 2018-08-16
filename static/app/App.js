/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('MyDesktop.App', {
	extend: 'Ext.ux.desktop.App',

	requires: [
		'Ext.window.MessageBox'
		,'Ext.ux.desktop.ShortcutModel'
		,'MyDesktop.etcd.DataView'
	]

	,init: function() {
		// custom logic before getXYZ methods get called...

		this.callParent();

		// now ready...
	}

	,getModules : function(){
		return [
			new MyDesktop.etcd.DataView()
		];
	}

	,getDesktopConfig: function () {
		var me = this, ret = me.callParent();

		return Ext.apply(ret, {
			//cls: 'ux-desktop-black',

			contextMenuItems: [
				{ text: 'Change Settings', handler: me.onSettings, scope: me }
			],

			shortcuts: Ext.create('Ext.data.Store', {
				model: 'Ext.ux.desktop.ShortcutModel'
				,data: [
					{ name: '系统日志', iconCls: 'data-shortcut', module: 'DataView-win'}
				]
			}),

			wallpaper: 'wallpapers/Blue-Sencha.jpg',
			wallpaperStretch: false
		});
	}

	// config for the start menu
	,getStartConfig : function() {
		var me = this, ret = me.callParent();

		return Ext.apply(ret, {
			title: 'Don Griffin',
			iconCls: 'user',
			height: 300,
			toolConfig: {
				width: 100,
				items: [{
						text:'系统配置',
						iconCls:'settings',
						handler: me.configSys,
						scope: me
					}
					,'-',{
						text:'桌面背景',
						iconCls:'settings',
						handler: me.onSettings,
						scope: me
					}
					,'-',{
						text:'Logout',
						iconCls:'logout',
						handler: me.onLogout,
						scope: me
					}
				]
			}
		});
	}

	,getTaskbarConfig: function () {
		var ret = this.callParent();

		return Ext.apply(ret, {
			quickStart: [
				{ name: 'Accordion Window', iconCls: 'accordion', module: 'acc-win' },
				{ name: 'Grid Window', iconCls: 'icon-grid', module: 'grid-win' }
			],
			trayItems: [
				{ xtype: 'trayclock', flex: 1 }
			]
		});
	}

	,onLogout: function () {
		Ext.Msg.confirm('Logout', 'Are you sure you want to logout?');
	}

	,onSettings: function () {
		var dlg = new MyDesktop.Settings({
			desktop: this.desktop
		});
		dlg.show();
	}
	,configSys:function(){
		var dlg = new MyDesktop.SysConfig({
			desktop: this.desktop
		});
		dlg.show();
	}
});
