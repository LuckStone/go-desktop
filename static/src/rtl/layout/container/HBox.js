Ext.define('Ext.rtl.layout.container.HBox', {
    override: 'Ext.layout.container.HBox',

    rtlNames: {
        beforeX: 'right',
        afterX: 'left'
    }
});