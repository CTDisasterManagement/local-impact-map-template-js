define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/on",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-class",
    "application/TableOfContents",
    "application/AboutDialog",
    "application/ShareDialog",
    "application/Drawer",
    "application/DrawerMenu",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "esri/dijit/BasemapToggle",
    "esri/dijit/Geocoder",
    "esri/dijit/Popup",
    "esri/dijit/Legend",
    "application/AreaOfInterest",
    "dijit/registry",
    "dojo/_base/array",
    "esri/lang"
],
function(
    declare,
    lang,
    arcgisUtils,
    domConstruct,
    dom,
    on,
    domStyle,
    domAttr,
    domClass,
    TableOfContents, AboutDialog, ShareDialog, Drawer, DrawerMenu,
    HomeButton, LocateButton, BasemapToggle,
    Geocoder,
    Popup,
    Legend,
    AreaOfInterest,
    registry,
    array,
    esriLang
) {
    return declare("", [AreaOfInterest], {
        config: {},
        constructor: function (config) {
            //config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information.
            this.config = config;
            // css classes
            this.css= {
                mobileSearchDisplay: "mobile-locate-box-display",
                toggleBlue: 'toggle-grey',
                toggleBlueOn: 'toggle-grey-on',
                panelPadding: "panel-padding",
                panelContainer: "panel-container",
                panelHeader: "panel-header",
                panelSection: "panel-section",
                panelSummary: "panel-summary",
                pointerEvents: "pointer-events",
                iconRight: "icon-right",
                locateButtonTheme: "LocateButtonCalcite",
                homebuttonTheme: "HomeButtonCalcite",
                desktopGeocoderTheme: "geocoder-desktop",
                mobileGeocoderTheme: "geocoder-mobile",
                iconList: "icon-list",
                iconLayers: "icon-layers",
                iconMap: "icon-map",
                iconText: "icon-text"
            };
            // mobile size switch domClass
            this._showDrawerSize = 850;
            // pointer event support
            if(this._pointerEventsSupport()){
                domClass.add(document.documentElement, this.css.pointerEvents);
            }
            // mobile size switch domClass
            this._showDrawerSize = 850;
            // drawer
            this._drawer = new Drawer({
                direction: this.config.i18n.direction,
                showDrawerSize: this._showDrawerSize,
                borderContainer: 'bc_outer',
                contentPaneCenter: 'cp_outer_center',
                contentPaneSide: 'cp_outer_left',
                toggleButton: 'hamburger_button'
            });
            // drawer resize event
            on(this._drawer, 'resize', lang.hitch(this, function () {
                // check mobile button status
                this._checkMobileGeocoderVisibility();
            }));
            // startup drawer
            this._drawer.startup();
            //supply either the webmap id or, if available, the item info 
            var itemInfo = this.config.itemInfo || this.config.webmap;
            this._createWebMap(itemInfo);
        },
        _pointerEventsSupport: function(){
            var element = document.createElement('x');
            element.style.cssText = 'pointer-events:auto';
            return element.style.pointerEvents === 'auto';   
        },
        _initLegend: function(){
            var legendNode = dom.byId('LegendDiv');
            if(legendNode){
                this._mapLegend = new Legend({
                    map: this.map,
                    layerInfos: this.layerInfos
                }, legendNode);
                this._mapLegend.startup();
            }
        },
        _initTOC: function(){
            // layers
            var tocNode = dom.byId('TableOfContents');
            if (tocNode) {
                var tocLayers = this.layers;
                var toc = new TableOfContents({
                    map: this.map,
                    layers: tocLayers
                }, tocNode);
                toc.startup();
            }
        },
        _init: function () {
            // drawer size check
            this._drawer.resize();
            // menu panels
            this.drawerMenus = [];
            var menuObj, content;
            // multiple polygons
            if (this.config.enableMapPanel) {
                content = '';
                content += '<div class="' + this.css.panelContainer + '">';
                // if summary enabled
                if (this.config.enableSummary) {
                    content += '<div class="' + this.css.panelHeader + '">' + this.config.i18n.general.mapInfo + '</div>';
                    content += '<div class="' + this.css.panelSummary + '" id="summary"></div>';
                }
                // show summary layer
                if(this.config.summaryLayer && this.config.summaryLayer.id){
                    content += '<div id="impact_area_section">';
                    content += '<div class="' + this.css.panelHeader + '"><span id="impact_area_title">' + this.config.i18n.general.impactArea + '</span></div>';
                    content += '<div id="renderer_menu"></div>';
                    content += '</div>';
                }
                content += '</div>';
                // menu
                menuObj = {
                    title: this.config.i18n.general.map,
                    label: '<div class="' + this.css.iconMap + '"></div><div class="' + this.css.iconText + '">' + this.config.i18n.general.map + '</div>',
                    content: content
                };
                // map menu
                if(this.config.defaultPanel === 'map'){
                    this.drawerMenus.splice(0,0,menuObj);
                }
                else{
                    this.drawerMenus.push(menuObj);
                }
            }
            if (this.config.enableLegendPanel) {
                content = '';
                content += '<div class="' + this.css.panelHeader + '">' + this.config.i18n.general.legend + '</div>';
                content += '<div class="' + this.css.panelContainer + '">';
                content += '<div class="' + this.css.panelPadding + '">';
                content += '<div id="LegendDiv"></div>';
                content += '</div>';
                content += '</div>';
                // menu info
                menuObj = {
                    title: this.config.i18n.general.legend,
                    label: '<div class="' + this.css.iconList + '"></div><div class="' + this.css.iconText + '">' + this.config.i18n.general.legend + '</div>',
                    content: content
                };
                // legend menu
                if(this.config.defaultPanel === 'legend'){
                    this.drawerMenus.splice(0,0,menuObj);
                }
                else{
                    this.drawerMenus.push(menuObj);
                }
            }
            // Layers Panel
            if (this.config.enableLayersPanel) {
                content = '';
                content += '<div class="' + this.css.panelHeader + '">' + this.config.i18n.general.layers + '</div>';
                content += '<div class="' + this.css.panelContainer + '">';
                content += '<div id="TableOfContents"></div>';
                content += '</div>';
                // menu info
                menuObj = {
                    title: this.config.i18n.general.layers,
                    label: '<div class="' + this.css.iconLayers + '"></div><div class="' + this.css.iconText + '">' + this.config.i18n.general.layers + '</div>',
                    content: content
                };
                // layers menu
                if(this.config.defaultPanel === 'layers'){
                    this.drawerMenus.splice(0,0,menuObj);
                }
                else{
                    this.drawerMenus.push(menuObj);
                }
            }
            // menus
            this._drawerMenu = new DrawerMenu({
                menus: this.drawerMenus
            }, dom.byId("drawer_menus"));
            this._drawerMenu.startup();
            // locate button
            if (this.config.enableLocateButton) {
                this._LB = new LocateButton({
                    map: this.map,
                    theme: this.css.locateButtonTheme
                }, 'LocateButton');
                this._LB.startup();
            }
            // home button
            if (this.config.enableHomeButton) {
                this._HB = new HomeButton({
                    map: this.map,
                    theme: this.css.homebuttonTheme
                }, 'HomeButton');
                this._HB.startup();
                // clear locate on home button
                on(this._HB, 'home', lang.hitch(this, function(){
                    if(this._LB){
                        this._LB.clear();
                    }
                }));
            }
            // basemap toggle
            if (this.config.enableBasemapToggle) {
                var BT = new BasemapToggle({
                    map: this.map,
                    basemap: this.config.nextBasemap,
                    defaultBasemap: this.config.defaultBasemap
                }, 'BasemapToggle');
                BT.startup();
                /* Start temporary until after JSAPI 4.0 is released */
                var layers = this.map.getLayersVisibleAtScale(this.map.getScale());
                on.once(this.map, 'basemap-change', lang.hitch(this, function () {
                    for (var i = 0; i < layers.length; i++) {
                        if (layers[i]._basemapGalleryLayerType) {
                            var layer = this.map.getLayer(layers[i].id);
                            this.map.removeLayer(layer);
                        }
                    }
                }));
                /* END temporary until after JSAPI 4.0 is released */
            }
            // about dialog
            if (this.config.enableAboutDialog) {
                this._AboutDialog = new AboutDialog({
                    theme: this.css.iconRight,
                    item: this.item,
                    sharinghost: this.config.sharinghost
                }, 'AboutDialog');
                this._AboutDialog.startup();
                if(this.config.showAboutOnLoad){
                    this._AboutDialog.open();
                }
            }
            // share dialog
            if (this.config.enableShareDialog) {
                this._ShareDialog = new ShareDialog({
                    theme: this.css.iconRight,
                    bitlyLogin: this.config.bitlyLogin,
                    bitlyKey: this.config.bitlyKey,
                    image: this.config.sharinghost + '/sharing/rest/content/items/' + this.item.id + '/info/' + this.item.thumbnail,
                    title: this.config.title,
                    summary: this.item.snippet,
                    hashtags: 'esriDSM'
                }, 'ShareDialog');
                this._ShareDialog.startup();
            }
            // startup legend
            this._initLegend();
            //  startup toc
            this._initTOC();
            // geocoders
            this._createGeocoders();
            // init area panel
            this.initArea();
            this.startupArea();
            // on body click containing underlay class
            on(document.body, '.dijitDialogUnderlay:click', function(){
                // get all dialogs
                var filtered = array.filter(registry.toArray(), function(w){ 
                    return w && w.declaredClass == "dijit.Dialog";
                });
                // hide all dialogs
                array.forEach(filtered, function(w){ 
                    w.hide(); 
                });
            });
            // builder mode
            if(this.config.edit){
                // require module
                require(["application/TemplateBuilder"], lang.hitch(this, function(TemplateBuilder){
                    // create template builder
                    var builder = new TemplateBuilder({
                        drawer: this._drawer
                    });
                    builder.startup();
                }));
            }
            // hide loading div
            this._hideLoadingIndicator();
            // drawer size check
            this._drawer.resize();
        },
        _checkMobileGeocoderVisibility: function () {
            if(this._mobileGeocoderIconNode && this._mobileSearchNode){
                // check if mobile icon needs to be selected
                if (domClass.contains(this._mobileGeocoderIconNode, this.css.toggleBlueOn)) {
                    domClass.add(this._mobileSearchNode, this.css.mobileSearchDisplay);
                }
            }
        },
        _showMobileGeocoder: function () {
            if(this._mobileSearchNode && this._mobileGeocoderIconContainerNode){
                domClass.add(this._mobileSearchNode, this.css.mobileSearchDisplay);
                domClass.replace(this._mobileGeocoderIconContainerNode, this.css.toggleBlueOn, this.css.toggleBlue);
            }
        },
        _hideMobileGeocoder: function () {
            if(this._mobileSearchNode && this._mobileGeocoderIconContainerNode){
                domClass.remove(this._mobileSearchNode, this.css.mobileSearchDisplay);
                domStyle.set(this._mobileSearchNode, "display", "none");
                domClass.replace(this._mobileGeocoderIconContainerNode, this.css.toggleBlue, this.css.toggleBlueOn);
            }
        },
        _setTitle: function (title) {
            // set config title
            this.config.title = title;
            // map title node
            var node = dom.byId('title');
            if (node) {
                // set title
                node.innerHTML = title;
                // title attribute
                domAttr.set(node, "title", title);
            }
            // window title
            window.document.title = title;
        },
        _createGeocoderOptions: function() {
            var hasEsri = false, esriIdx, geocoders = lang.clone(this.config.helperServices.geocode);
            // default options
            var options = {
                map: this.map,
                autoNavigate: true,
                autoComplete: true,
                arcgisGeocoder: true,
                geocoders: null
            };
            //only use geocoders with a url defined
            geocoders = array.filter(geocoders, function (geocoder) {
                if (geocoder.url) {
                    return true;
                }
                else{
                    return false;
                }
            });
            // at least 1 geocoder defined
            if(geocoders.length){
                // each geocoder
                array.forEach(geocoders, function (geocoder) {
                    // if esri geocoder
                    if (geocoder.url && geocoder.url.indexOf(".arcgis.com/arcgis/rest/services/World/GeocodeServer") > -1) {
                        hasEsri = true;
                        geocoder.name = "Esri World Geocoder";
                        geocoder.outFields = "Match_addr, stAddr, City";
                        geocoder.singleLineFieldName = "Single Line";
                        geocoder.esri = geocoder.placefinding = true;
                    }
                });
                //only use geocoders with a singleLineFieldName that allow placefinding unless its custom
                geocoders = array.filter(geocoders, function (geocoder) {
                    if (geocoder.name && geocoder.name === "Custom") {
                        return (esriLang.isDefined(geocoder.singleLineFieldName));
                    } else {
                        return (esriLang.isDefined(geocoder.singleLineFieldName) && esriLang.isDefined(geocoder.placefinding) && geocoder.placefinding);
                    }
                });
                // if we have an esri geocoder
                if (hasEsri) {
                    for (var i = 0; i < geocoders.length; i++) {
                        if (esriLang.isDefined(geocoders[i].esri) && geocoders[i].esri === true) {
                            esriIdx = i;
                            break;
                        }
                    }
                }
                // set autoComplete
                options.autoComplete = hasEsri;
                // set esri options
                if (hasEsri) {
                    options.minCharacters = 0;
                    options.maxLocations = 5;
                    options.searchDelay = 100;
                }
                //If the World geocoder is primary enable auto complete 
                if (hasEsri && esriIdx === 0) {
                    options.arcgisGeocoder = geocoders.splice(0, 1)[0]; //geocoders[0];
                    if (geocoders.length > 0) {
                        options.geocoders = geocoders;
                    }
                } else {
                    options.arcgisGeocoder = false;
                    options.geocoders = geocoders;
                }
            }
            return options;
        },
        // create geocoder widgets
        _createGeocoders: function () {
            // get options
            var createdOptions = this._createGeocoderOptions();
            // desktop geocoder options
            var desktopOptions = lang.mixin({}, createdOptions, {
                theme: this.css.desktopGeocoderTheme
            });
            // mobile geocoder options
            var mobileOptions = lang.mixin({}, createdOptions, {
                theme: this.css.mobileGeocoderTheme
            });
            // desktop size geocoder
            this._geocoder = new Geocoder(desktopOptions, dom.byId("geocoderSearch"));
            this._geocoder.startup();
            // geocoder results
            on(this._geocoder, 'find-results', lang.hitch(this, function (response) {
                if (!response.results || !response.results.results || !response.results.results.length) {
                    alert(this.config.i18n.general.noSearchResult);
                }
            }));
            // mobile sized geocoder
            this._mobileGeocoder = new Geocoder(mobileOptions, dom.byId("geocoderMobile"));
            this._mobileGeocoder.startup();
            // geocoder results
            on(this._mobileGeocoder, 'find-results', lang.hitch(this, function (response) {
                if (!response.results || !response.results.results || !response.results.results.length) {
                    alert(this.config.i18n.general.noSearchResult);
                }
                this._hideMobileGeocoder();
            }));
            // keep geocoder values in sync
            this._geocoder.watch("value", lang.hitch(this, function (name, oldValue, value) {
                this._mobileGeocoder.set("value", value);
            }));
            // keep geocoder values in sync
            this._mobileGeocoder.watch("value", lang.hitch(this, function (name, oldValue, value) {
                this._geocoder.set("value", value);
            }));
            // geocoder nodes
            this._mobileGeocoderIconNode = dom.byId("mobileGeocoderIcon");
            this._mobileSearchNode = dom.byId("mobileSearch");
            this._mobileGeocoderIconContainerNode = dom.byId("mobileGeocoderIconContainer");
            // mobile geocoder toggle 
            if (this._mobileGeocoderIconNode) {
                on(this._mobileGeocoderIconNode, "click", lang.hitch(this, function () {
                    if (domStyle.get(this._mobileSearchNode, "display") === "none") {
                        this._showMobileGeocoder();
                    } else {
                        this._hideMobileGeocoder();
                    }
                }));
            }
            var closeMobileGeocoderNode = dom.byId("btnCloseGeocoder");
            if(closeMobileGeocoderNode){
                // cancel mobile geocoder
                on(closeMobileGeocoderNode, "click", lang.hitch(this, function () {
                    this._hideMobileGeocoder();
                }));
            }
        },
        // hide map loading spinner
        _hideLoadingIndicator: function () {
            var indicator = dom.byId("loadingIndicatorDiv");
            if (indicator) {
                domStyle.set(indicator, "display", "none");
            }
        },
        _setLayerMode: function(itemInfo, id){
            // if we have a layer id
            if (id && itemInfo && itemInfo.itemData && itemInfo.itemData.operationalLayers) {
                for (var i = 0; i < itemInfo.itemData.operationalLayers.length; i++) {
                    if (itemInfo.itemData.operationalLayers[i].id === id) {
                        // set snapshot mode
                        if(itemInfo.itemData.operationalLayers[i].hasOwnProperty('mode')){
                            itemInfo.itemData.operationalLayers[i].mode = 0;
                        }
                        // record layer order index
                        this._impactLayerIndex = i;
                    }
                }
            }
            return itemInfo;
        },
        //create a map based on the input web map id
        _createWebMap: function (itemInfo) {
            // set impact layer mode to snapshot
            itemInfo = this._setLayerMode(itemInfo, this.config.summaryLayer.id);
            // popup dijit
            var customPopup = new Popup({}, domConstruct.create("div"));
            // add popup theme
            domClass.add(customPopup.domNode, "calcite");
            //can be defined for the popup like modifying the highlight symbol, margin etc.
            arcgisUtils.createMap(itemInfo, "mapDiv", {
                mapOptions: {
                    infoWindow: customPopup
                    //Optionally define additional map config here for example you can
                    //turn the slider off, display info windows, disable wraparound 180, slider position and more.
                },
                bingMapsKey: this.config.bingmapskey
            }).then(lang.hitch(this, function (response) {
                //Once the map is created we get access to the response which provides important info
                //such as the map, operational layers, popup info and more. This object will also contain
                //any custom options you defined for the template. In this example that is the 'theme' property.
                //Here' we'll use it to update the application to match the specified color theme.
                this.map = response.map;
                this.layers = response.itemInfo.itemData.operationalLayers;
                this.item = response.itemInfo.item;
                this.bookmarks = response.itemInfo.itemData.bookmarks;
                this.layerInfos = arcgisUtils.getLegendLayers(response);
                // if title is enabled
                if (this.config.enableTitle) {
                    this._setTitle(this.config.title || response.itemInfo.item.title);
                }
                if (this.map.loaded) {
                    this._init();
                } else {
                    on.once(this.map, 'load', lang.hitch(this, function () {
                        this._init();
                    }));
                }
            }), lang.hitch(this, function (error) {
                //an error occurred - notify the user. In this example we pull the string from the
                //resource.js file located in the nls folder because we've set the application up
                //for localization. If you don't need to support multiple languages you can hardcode the
                //strings here and comment out the call in index.html to get the localization strings.
                if (this.config && this.config.i18n) {
                    alert(this.config.i18n.map.error + ": " + error.message);
                } else {
                    alert("Unable to create map: " + error.message);
                }
                // hide loading div
                this._hideLoadingIndicator();
            }));
        }
    });
});