define([], function() {
    //Default configuration settings for the applciation. This is where you'll define things like a bing maps key,
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings
    //and url parameters.
    var defaults = {
        "appid": "",
        "webmap": "8c59dfba1f9b46ca88331f1a830a0ee9",
        // "0eece0d5de2140e9a44d8050f943fd18", "de5ae0c2040c49d38e9ea0637454ac73"
        "oauthappid": null,
        //"AFTKRmv16wj14N3z",
        //Group templates must support a group url parameter. This will contain the id of the group.
        //group: "",
        //Enter the url to the proxy if needed by the applcation. See the 'Using the proxy page' help topic for details
        //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
        "proxyurl": "",
        //Example of a template specific property. If your template had several color schemes
        //you could define the default here and setup configuration settings to allow users to choose a different
        //color theme.
        "impact_layer": "Impact Area",
        // "legend" or "areas"
        "defaultPanel": "areas",
        // overwritten by renderer info
        "impact_field": "GRID_CODE",
        "sum_variables": ['TOTPOP_CY', 'TOTHH_CY', 'CIKR_Total', 'BUS_Total', 'POP15_CY', 'POP65U_CY', 'OWNER_CY', 'RENTER_CY', 'CIKR_AMTwr', 'CIKR_BrTn', 'CIKR_Dam', 'CIKR_Edu', 'CIKR_ECC', 'CIKR_FMTwr', 'CIKR_FrSta', 'CIKR_Hzmt', 'CIKR_HCF', 'CIKR_PkIco', 'CIKR_Pol', 'CIKR_Port', 'CIKR_Rsrvr', 'CIKR_WWF', 'CIKR_Pwr', 'BUS_Banks', 'BUS_Hsptl', 'BUS_GrcStr', 'BUS_PnTSvc', 'BUS_Safety', 'BUS_Util', 'BUS_BldSpl', 'BUS_GasStn', 'BUS_DptStr', 'BUS_Ldging', 'BUS_Other'],
        //Enter the url to your organizations bing maps key if you want to use bing basemaps
        "bingmapskey": "",
        "bitlyLogin": "esri",
        "bitlyKey": "R_65fd9891cd882e2a96b99d4bda1be00e",
        //Defaults to arcgis.com. Set this value to your portal or organization host name.
        "sharinghost": location.protocol + "//" + "www.arcgis.com"
    };
    return defaults;
});