define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has",
    "esri/kernel",
    "dijit/_WidgetBase",
    "dijit/a11yclick",
    "dijit/_TemplatedMixin",
    "dojo/on",
    // load template
    "dojo/text!modules/dijit/templates/AboutDialog.html",
    "dojo/i18n!modules/nls/AboutDialog",
    "dojo/dom-class",
    "dojo/dom-style",
    "dijit/Dialog"
],
function (
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, a11yclick, _TemplatedMixin,
    on,
    dijitTemplate, i18n,
    domClass, domStyle,
    Dialog
) {
    var Widget = declare([_WidgetBase, _TemplatedMixin, Evented], {
        declaredClass: "esri.dijit.AboutDialog",
        templateString: dijitTemplate,
        options: {
            theme: "AboutDialog",
            visible: true,
            info: null,
            sharinghost: "http://www.arcgis.com",
            dialog: null
        },
        // lifecycle: 1
        constructor: function(options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // widget node
            this.domNode = srcRefNode;
            this._i18n = i18n;
            // properties
            this.set("theme", defaults.theme);
            this.set("visible", defaults.visible);
            this.set("dialog", defaults.dialog);
            this.set("item", defaults.item);
            this.set("sharinghost", defaults.sharinghost);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            // classes
            this._css = {
                container: "buttonContainer",
                button: "toggle-grey",
                buttonSelected: "toggle-grey-on",
                icon: "icon-info-circled-1",
                aboutDialogHeader: "aboutDialogHeader",
                aboutDialogContent: "aboutDialogContent",
                nodeDescription: "nodeDescription",
                headerNodeDescription: "headerNodeDescription",
                moreInfo:"moreInfo"
            };
        },
        // bind listener for button to action
        postCreate: function() {
            this.inherited(arguments);
            this.own(on(this._buttonNode, a11yclick, lang.hitch(this, this.toggle)));
        },
        // start widget. called by user
        startup: function() {
            this._init();
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function() {
            this._removeEvents();
            this.inherited(arguments);
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        // open
        // close
        // toggle
        /* ---------------- */
        /* Public Functions */
        /* ---------------- */
        show: function() {
            this.set("visible", true);
        },
        hide: function() {
            this.set("visible", false);
        },
        open: function() {
            domClass.add(this._buttonNode, this._css.buttonSelected);
            this.get("dialog").show();
            this.emit("open", {});
        },
        close: function() {
            this.get("dialog").hide();
            this.emit("close", {});
        },
        toggle: function() {
            var open = this.get("dialog").get("open");
            if (open) {
                this.close();
            } else {
                this.open();
            }
            this.emit("toggle", {});
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _removeEvents: function(){
            if(this._events && this._events.length){
                for(var i = 0; i < this._events.length; i++){
                    this._events[i].remove();
                }
            }
            this._events = [];
        },
        _init: function() {
            // dialog
            if (!this.get("dialog")) {
                var dialog = new Dialog({
                    title: i18n.widgets.AboutDialog.title,
                    draggable: false,
                    style: "max-width: 550px;"
                }, this._dialogNode);
                this.set("dialog", dialog);
            }
            // setup events
            this._removeEvents();
            // hide event
            var dialogHide = on(this.get("dialog"), 'hide', lang.hitch(this, function() {
                domClass.remove(this._buttonNode, this._css.buttonSelected);
            }));
            this._events.push(dialogHide);
            // rotate event
            var rotate = on(window, "orientationchange", lang.hitch(this, function() {
                var open = this.get("dialog").get("open");
                if (open) {
                    dialog.hide();
                    dialog.show();
                }
            }));
            this._events.push(rotate);
            // set content
            this._setDialogContent();
            this._visible();
            this.set("loaded", true);
            this.emit("load", {});
        },
        _setDialogContent: function() {
            var item = this.get("item");
            if (item) {
                // title
                this._titleNode.innerHTML = item.title;
                // description
                this._descriptionNode.innerHTML = item.description;
                // license
                this._licenseInfoNode.innerHTML = item.licenseInfo;
                // more info link
                this._moreInfoNode.innerHTML = '<a target="_blank" href="' + this.get("sharinghost") + '/home/item.html?id=' + item.id + '">' + i18n.widgets.AboutDialog.itemInfo + '</a> ' + i18n.widgets.AboutDialog.itemInfoLink;
            }
        },
        _updateThemeWatch: function(attr, oldVal, newVal) {
            if (this.get("loaded")) {
                domClass.remove(this.domNode, oldVal);
                domClass.add(this.domNode, newVal);
            }
        },
        _visible: function() {
            if (this.get("visible")) {
                domStyle.set(this.domNode, 'display', 'block');
            } else {
                domStyle.set(this.domNode, 'display', 'none');
            }
        }
    });
    if (has("extend-esri")) {
        lang.setObject("dijit.AboutDialog", Widget, esriNS);
    }
    return Widget;
});
