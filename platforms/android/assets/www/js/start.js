var arrJsFiles = [
    'js/helpers/location.js',
    'js/controllers/login.js',
    'js/controllers/home.js',
    'js/controllers/coupon.js',
    'js/controllers/my_location.js',
    'js/controllers/search.js',
    'js/controllers/mycoupons.js',
	'js/controllers/wallet.js',
    'js/controllers/profile.js',
	'js/controllers/redeem.js',
    'js/controllers/iframe.js',
    'js/controllers/storesbrands.js'
];


var fnStart = function () {
    var deviceReadyDeferred = $.Deferred();
    var jqmReadyDeferred = $.Deferred();
    $.when(deviceReadyDeferred, jqmReadyDeferred).then(appInit);

    function appInit() {
        loadJS(0);
        bindGestures();
        //Init facebook
        DistimoSDK.start('ccAYLASJVTzXHMIz');

        //  openFB.init({ appId: '315208965298488', tokenStore: window.localStorage });
        openFB.init({ appId: '891920717486080', tokenStore: window.localStorage });

        //navigator.splashscreen.hide();
    }
    function deviceReady() {
        deviceReadyDeferred.resolve();
    }

    $(document).one("ready", function () {
        jqmReadyDeferred.resolve();
        document.addEventListener("deviceReady", deviceReady, false);
    });
}

//Load JS files
function loadJS(idx) {
    if (idx < arrJsFiles.length) {
        $.getScript(arrJsFiles[idx], function (data, textStatus, jqxhr) {
            loadJS(++idx);
        });
    }
    else {
        loadExternalHtmls();
    }
}

//Load external html pages and insert them in the DOM, such as multiple page in a single Html file.
function loadExternalHtmls() {
    //checkConnection();
    var user = localStorage.getItem("CurrentUser");
    if (user != null) {
        //HomeCtrl.pageLoad();
        //window.location.hash = '#index-page';
        //$.mobile.initializePage();
        //$(":mobile-pagecontainer").pagecontainer("change", "#index-page", { transition: transition, showLoadMsg: true, reverse: reverse });
        //closeSplash();
        //HomeCtrl.open(false, 'flip');
        setTimeout(function () { HomeCtrl.open(false, 'flip'); }, 500);
    } else {
        //navigator.splashscreen.hide();
        ////window.location.hash = 'index-page';
        //$.mobile.initializePage();
        //$("#login-page").page("destroy").page();
        $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function () {
            closeSplash();
        });
        $(":mobile-pagecontainer").pagecontainer("change", "#login-page", { transition: 'flip', showLoadMsg: true });
    }
}

function bindGestures() {

    $('a[href^="#"]').not(".nobind").off("click").on("click", function (event) {
        try {
            event.preventDefault();
            var pageUrl = $(this).attr("href");
            if ($(this).hasClass('back')) {
                if (pageUrl.substring(0, 1) == "#") {
                    navTo(pageUrl);
                }
                else {
                    navBack();
                }
                return;
            }
            //alert(pageUrl);
            navTo(pageUrl);
        } catch (ex) {
            alert(JSON.stringify(ex));
        }
    });
}

function navTo(page, reverse, transition) {
    reverse = reverse || false;
    transition = transition || "slide";

    var activePage = $(":mobile-pagecontainer").pagecontainer("getActivePage").attr("id");

    if (page == '#' + activePage || page == activePage) { closeSideMenu(); return; }
    //alert(page+' : '+activePage);
    $(":mobile-pagecontainer").pagecontainer("change", page, { transition: "slide", showLoadMsg: true });
    closeSideMenu();
    switch (page) {
        case '#location-page':
            MyLocation.open();
            return;
        case '#search-page':
            MySearch.open();
            return;
        case '#mycoupons-page':
            MyCoupons.open();
            return;
        case '#index-page':
            HomeCtrl.pageLoad();
            HomeCtrl.open();
            return;
        case '#category':
            HomeCtrl.openCategories();
            return;
        case '#wallet-page':
            WalletCtrl.open();
            return;
        case '#profile-page':
            ProfileCtrl.open();
            return;
        case '#feedback-page':
            $(":mobile-pagecontainer").pagecontainer("change", "#feedback-page", { transition: "slide", showLoadMsg: true, reverse: false });
            $("#ifrSurvey").attr("src", "http://www.couwallabi.com/survey");
            $.mobile.loading('hide', { textVisible: false });
            return;
        case '#searchmycoupons-page':
            MyCoupons.openSearchCoupons();
            return;
        case '#storesbrands-page':
            StoBraCtrl.open();
            return;
        case '#':

            return;
    }

}

function navBack() {
    window.history.back();
}

var dates = {
    toLiteral: function (d) {
        var m_names = new Array("Jan", "Feb", "Mar",
        "Apr", "May", "Jun", "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec");
        var curr_date = d.getDate() + 1;
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();
        return m_names[curr_month] + " " + curr_date + ", " + curr_year;
        //document.write(curr_date + "-" + m_names[curr_month]
        //+ "-" + curr_year);
    },
    convert: function (d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0], d[1], d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year, d.month, d.date) :
            NaN
        );
    },
    compare: function (a, b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a = this.convert(a).valueOf()) &&
            isFinite(b = this.convert(b).valueOf()) ?
            (a > b) - (a < b) :
            NaN
        );
    },
    inRange: function (d, start, end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
        return (
             isFinite(d = this.convert(d).valueOf()) &&
             isFinite(start = this.convert(start).valueOf()) &&
             isFinite(end = this.convert(end).valueOf()) ?
             start <= d && d <= end :
             NaN
         );
    }
}

function urlApi(str) {
    var url = "http://api.couwallabi.com/v2/" + str;
    //var url = "http://dev.couwallabi.com/v2/" + str;
	//url = "http://192.168.0.60:61234/CouwallaAdmin/v2/" + str;
    return url;
}

function barcodeURL(bartype, barcodedata) {
    return "https://api.scandit.com/barcode-generator/v1/" + bartype
        + "/" + barcodedata + "?key=3uP_r479pvc-XJxLXmIR7TUa6HaP4NybUjtVBgkSmE_"
}

function openCloseMenu(panelid) {
    $("#" + panelid).html($("#main-nav-panel").html());
    bindGestures();
    $("#" + panelid).panel("toggle");
}

function SendAlert(message, title, btnName, fnCallBack) {
    title = title || "COUWALLA";
    btnName = btnName || "OK";
    fnCallBack = fnCallBack || null;
    try {
        navigator.notification.alert(message, fnCallBack, title, btnName);
    }
    catch (err) {
        //alert('error on send alert');
        alert(message);
    }
}

function closeSplash() {
    if (navigator.splashscreen)
        navigator.splashscreen.hide();
}

function openWebBrowser(url) {
    window.open(url, "_system", 'location=yes');
}

/*############# Globals functions ##################*/

//add format functionality to strings
String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};



/*#### SWIPE SUPPORT ######*/
var supportTouch = $.support.touch,
            scrollEvent = "touchmove scroll",
            touchStartEvent = supportTouch ? "touchstart" : "mousedown",
            touchStopEvent = supportTouch ? "touchend" : "mouseup",
            touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
$.event.special.swipeupdown = {
    setup: function () {
        var thisObject = this;
        var $this = $(thisObject);
        $this.bind(touchStartEvent, function (event) {
            var data = event.originalEvent.touches ?
                    event.originalEvent.touches[0] :
                    event,
                    start = {
                        time: (new Date).getTime(),
                        coords: [data.pageX, data.pageY],
                        origin: $(event.target)
                    },
                    stop;

            function moveHandler(event) {
                if (!start) {
                    return;
                }
                var data = event.originalEvent.touches ?
                        event.originalEvent.touches[0] :
                        event;
                stop = {
                    time: (new Date).getTime(),
                    coords: [data.pageX, data.pageY]
                };

                // prevent scrolling
                if (Math.abs(start.coords[1] - stop.coords[1]) > 10) {
                    event.preventDefault();
                }
            }
            $this
                    .bind(touchMoveEvent, moveHandler)
                    .one(touchStopEvent, function (event) {
                        $this.unbind(touchMoveEvent, moveHandler);
                        if (start && stop) {
                            if (stop.time - start.time < 1000 &&
                                    Math.abs(start.coords[1] - stop.coords[1]) > 30 &&
                                    Math.abs(start.coords[0] - stop.coords[0]) < 75) {
                                start.origin
                                        .trigger("swipeupdown")
                                        .trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
                            }
                        }
                        start = stop = undefined;
                    });
        });
    }
};
$.each({
    swipedown: "swipeupdown",
    swipeup: "swipeupdown"
}, function (event, sourceEvent) {
    $.event.special[event] = {
        setup: function () {
            $(this).bind(sourceEvent, $.noop);
        }
    };
});

function closeSideMenu() {
    try {
        $('#main-nav-panel').panel("close");
        $('#nav-panel').panel("close");
    }
    catch (ex) {

    }
}
//document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    alert('Connection type: ' + states[networkState]);
}