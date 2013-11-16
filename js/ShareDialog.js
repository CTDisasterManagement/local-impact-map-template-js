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
    "dojo/text!modules/dijit/templates/ShareDialog.html",
    "dojo/i18n!modules/nls/ShareDialog",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojox/html/entities",
    "esri/request",
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
    entities,
    esriRequest,
    Dialog
) {
    var Widget = declare([_WidgetBase, _TemplatedMixin, Evented], {
        declaredClass: "esri.dijit.ShareDialog",
        templateString: dijitTemplate,
        options: {
            theme: "ShareDialog",
            visible: true,
            url: window.location.href,
            dialog: null,
            facebookURL: "http://www.facebook.com/sharer.php?u=",
            twitterURL: "https://twitter.com/share?url=",
            emailSubject: "Check out this map!",
            emailBody: "View the map here: ",
            googlePlusURL: "https://plus.google.com/share?url=",
            bitlyAPI: "http://api.bit.ly/v3/shorten",
            bitlyLogin: "",
            bitlyKey: "",
            embedSizes: [{
                "width": "100%",
                "height": "500px"
            }, {
                "width": "100%",
                "height": "400px"
            }, {
                "width": "100%",
                "height": "300px"
            }, {
                "width": "800px",
                "height": "640px"
            }, {
                "width": "640px",
                "height": "480px"
            }]
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
            this.set("url", defaults.url);
            this.set("visible", defaults.visible);
            this.set("dialog", defaults.dialog);
            this.set("embedSizes", defaults.embedSizes);
            this.set("embedHeight", defaults.embedHeight);
            this.set("embedWidth", defaults.embedWidth);
            this.set("facebookURL", defaults.facebookURL);
            this.set("twitterURL", defaults.twitterURL);
            this.set("googlePlusURL", defaults.googlePlusURL);
            this.set("emailSubject", defaults.emailSubject);
            this.set("emailBody", defaults.emailBody);
            this.set("bitlyAPI", defaults.bitlyAPI);
            this.set("bitlyLogin", defaults.bitlyLogin);
            this.set("bitlyKey", defaults.bitlyKey);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("url", this._updateUrls);
            this.watch("visible", this._visible);
            this.watch("embedSizes", this._setSizeOptions);
            // classes
            this._css = {
                container: "buttonContainer",
                embed: "embedPage",
                button: "toggle-grey",
                buttonSelected: "toggle-grey-on",
                icon: "icon-share",
                facebookIcon: "icon-facebook-squared-1 shareDialogIconClass",
                twitterIcon: "icon-twitter-1 shareDialogIconClass",
                gplusIcon: "icon-gplus shareDialogIconClass",
                emailIcon: "icon-mail shareDialogIconClass",
                mapSizeLabel: "mapSizeLabel",
                shareMapURL: "shareMapURL",
                iconContainer: "iconContainer",
                embedMapSizeDropDown: "embedMapSizeDropDown",
                shareDialogContent: "dialogContent",
                shareDialogSubHeader: "shareDialogSubHeader",
                shareDialogTextarea: "shareDialogTextarea",
                mapSizeContainer: "mapSizeContainer",
                embedMapSizeClear: "embedMapSizeClear",
                iconClear: "iconClear"
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
            this._shareLink();
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
        _removeEvents: function() {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },
        _setSizeOptions: function() {
            var html = '';
            if (this.get("embedSizes") && this.get("embedSizes").length) {
                // map sizes
                for (var i = 0; i < this.get("embedSizes").length; i++) {
                    if (i === 0) {
                        this.set("embedWidth", this.get("embedSizes")[i].width);
                        this.set("embedHeight", this.get("embedSizes")[i].height);
                    }
                    html += '<option value="' + i + '">' + this.get("embedSizes")[i].width + " x " + this.get("embedSizes")[i].height + '</option>';
                }
            }
            this._comboBoxNode.innerHTML = html;
        },
        _updateUrls: function() {
            this.set("bitlyUrl", null);
            this._updateEmbedCode();
            this._shareMapUrlText.value = this.get("url");
        },
        _init: function() {
            // setup events
            this._removeEvents();
            // set sizes for select box
            this._setSizeOptions();
            // dialog
            if (!this.get("dialog")) {
                var dialog = new Dialog({
                    title: i18n.widgets.ShareDialog.title,
                    draggable: false,
                    style: "max-width:550px;"
                }, this._dialogNode);
                this.set("dialog", dialog);
            }
            // dialog hide
            var dialogHide = on(this.get("dialog"), 'hide', lang.hitch(this, function() {
                domClass.remove(this._buttonNode, this._css.buttonSelected);
            }));
            this._events.push(dialogHide);
            // set visible
            this._visible();
            // set embed url
            this._updateUrls();
            // select menu change
            var selectChange = on(this._comboBoxNode, "change", lang.hitch(this, function(evt) {
                this.set("embedWidth", this.get("embedSizes")[parseInt(evt.currentTarget.value, 10)].width);
                this.set("embedHeight", this.get("embedSizes")[parseInt(evt.currentTarget.value, 10)].height);
                this._updateEmbedCode();
            }));
            this._events.push(selectChange);
            // facebook click
            var facebook = on(this._facebookButton, "click", lang.hitch(this, function() {
                this._configureShareLink(this.get("facebookURL"));
            }));
            this._events.push(facebook);
            // twitter click
            var twitter = on(this._twitterButton, "click", lang.hitch(this, function() {
                this._configureShareLink(this.get("twitterURL"));
            }));
            this._events.push(twitter);
            // google plus click
            var gplus = on(this._gpulsButton, "click", lang.hitch(this, function() {
                this._configureShareLink(this.get("googlePlusURL"));
            }));
            this._events.push(gplus);
            // email click
            var email = on(this._emailButton, "click", lang.hitch(this, function() {
                this._configureShareLink('mailto:%20?subject=' + encodeURIComponent(this.get("emailSubject")) + '&body=' + encodeURIComponent(this.get("emailBody")), true);
            }));
            this._events.push(email);
            // link box click
            var linkclick = on(this._shareMapUrlText, "click", lang.hitch(this, function() {
                this._shareMapUrlText.select();
            }));
            this._events.push(linkclick);
            // embed box click
            var embedclick = on(this._embedNode, "click", lang.hitch(this, function() {
                this._embedNode.select();
            }));
            this._events.push(embedclick);
            // rotate
            var rotate = on(window, "orientationchange", lang.hitch(this, function() {
                var open = this.get("dialog").get("open");
                if (open) {
                    dialog.hide();
                    dialog.show();
                }
            }));
            this._events.push(rotate);
            // loaded
            this.set("loaded", true);
            this.emit("load", {});
        },
        _updateEmbedCode: function() {
            var es = '<iframe width="' + this.get("embedWidth") + '" height="' + this.get("embedHeight") + '" src="' + this.get("url") + '" frameborder="0" scrolling="no"></iframe>';
            this.set("embed", es);
            this._embedNode.innerHTML = entities.encode(es);
        },
        _shareLink: function() {
            if (this.get("bitlyAPI") && this.get("bitlyLogin") && this.get("bitlyKey")) {
                esriRequest({
                    url: this.get("bitlyAPI"),
                    callbackParamName: "callback",
                    content: {
                        uri: this.get("url"),
                        login: this.get("bitlyLogin"),
                        apiKey: this.get("bitlyKey"),
                        f: "json"
                    },
                    load: lang.hitch(this, function(response) {
                        if (response && response.data && response.data.url) {
                            this.set("bitlyUrl") = response.data.url;
                        }
                        if (this.get("bitlyUrl")) {
                            this._shareMapUrlText.value = this.get("bitlyUrl");
                        }
                    }),
                    error: function(error) {
                        console.log(error);
                    }
                });
            }
        },
        _configureShareLink: function(Link, isMail) {
            var fullLink = Link + (this.get("bitlyUrl") ? this.get("bitlyUrl") : this.get("url"));
            if (isMail) {
                window.location.href = fullLink;
            } else {
                window.open(fullLink, 'share', true);
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
        lang.setObject("dijit.ShareDialog", Widget, esriNS);
    }
    return Widget;
});
