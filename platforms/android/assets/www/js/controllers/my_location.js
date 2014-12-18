var MyLocation = {
    init: function () {
        $(":mobile-pagecontainer").pagecontainer("load", "location.html", { role: 'page' });
        //this.loadEvents();
    },
    open: function (transition) {
        transition = transition || 'slide';
        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            MyLocation.loadData();
            MyLocation.loadEvents();
            bindGestures();
        });
        $(":mobile-pagecontainer").pagecontainer("change", "location.html", { transition: transition, showLoadMsg: true });
    },
    loadEvents: function () {


        //Current location
        $("#chkCurrenLoc").unbind("click").on("click", function () {
            if ($(this).attr("src") == "images/checked.png") return;
            $.mobile.loading('show');
            $(this).attr("src", "images/checked.png");
            $("#chkHomeZip").attr("src", "images/unchecked.png");
            $("#chkOtherZip").attr("src", "images/unchecked.png");

            $("#chkOtherZip").parent().find("label").show();
            $("#chkOtherZip").parent().find("input").remove();

            $("#chkHomeZip").parent().find("label").show();
            $("#chkHomeZip").parent().find("input").remove();

            GeoLocation.getCurrent(function () {
                var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                var reqData = { "userid": crrnUsr.id, "latitude": GeoLocation.latitude, "longitude": GeoLocation.longitude };
                MyLocation.setLocation(reqData, 'loc', '');
            }, function () {
                //SendAlert("Error on get GPS data.");
                console.log("Error on get GPS data.");
                var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                var reqData = { "userid": crrnUsr.id, "latitude": "", "longitude": "" };
                MyLocation.setLocation(reqData, 'loc', '');
            });
        });

        //Set ZIP as Home
        $("#chkHomeZip").unbind("click").on("click", function () {
            if ($(this).attr("src") == "images/checked.png") return;

            $(this).attr("src", "images/checked.png");
            $("#chkCurrenLoc").attr("src", "images/unchecked.png");
            $("#chkOtherZip").attr("src", "images/unchecked.png");

            $("#chkOtherZip").parent().find("label").show();
            $("#chkOtherZip").parent().find("input").remove();

            $(this).parent().find("label").hide();
            $(this).parent().append($("<input type='text' id='txtHomeZip'/>"));

            //fix keyboard header push
            $("#txtHomeZip").focus(function (ev) {
                //$("div[data-role='header']").hide();
                //$("#location-page").css("padding-top", "0px");
            }).blur(function (ev) {
                //var hdr = $("div[data-role='header']").height();
                //$("div[data-role='header']").show();
                //$("#location-page").css("padding-top", hdr + "px");
            }).keypress(function (ev) {
                if (ev.keyCode == '13') {
                    var homezip = $("#txtHomeZip").val();

                    if (/^\d{5}(?:[-\s]\d{4})?$/.test(homezip)) {
                        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                        var reqData = { "userid": crrnUsr.id, "zip": homezip, "home": "1" };
                        MyLocation.setLocation(reqData, 'home', homezip);
                    } else {
                        SendAlert("Zip Code should be of 5 digits or 9 digits");
                    }
                }

            });

            $("#txtHomeZip").focus();
        });

        //Other ZIP
        $("#chkOtherZip").unbind("click").on("click", function () {
            if ($(this).attr("src") == "images/checked.png") return;

            $(this).attr("src", "images/checked.png");
            $("#chkCurrenLoc").attr("src", "images/unchecked.png");
            $("#chkHomeZip").attr("src", "images/unchecked.png");

            $("#chkHomeZip").parent().find("label").show();
            $("#chkHomeZip").parent().find("input").remove();

            $(this).parent().find("label").hide();
            $(this).parent().append($("<input type='text' id='txtOtherZip'/>"));

            //fix keyboard header push
            $("#txtOtherZip").focus(function (ev) {
                //$("div[data-role='header']").hide();
                //$("#location-page").css("padding-top", "0px");
            }).blur(function (ev) {
                //var hdr = $("div[data-role='header']").height();
                //$("div[data-role='header']").show();
                //$("#location-page").css("padding-top", hdr + "px");
            }).keypress(function (ev) {
                if (ev.keyCode == '13') {
                    var otherzip = $("#txtOtherZip").val();

                    if (/^\d{5}(?:[-\s]\d{4})?$/.test(otherzip)) {
                        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                        var reqData = { "userid": crrnUsr.id, "zip": otherzip };
                        MyLocation.setLocation(reqData, 'other', otherzip);
                    } else {
                        SendAlert("Zip Code should be of 5 digits or 9 digits");
                    }
                }
            });

            $("#txtOtherZip").focus();
        });
    },
    setLocation: function (data, type, value) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({
            url: urlApi('set_user_location.php?data=' + JSON.stringify(data)),
            type: 'GET'
        }).done(function (result) {
            $.mobile.loading('hide', { textVisible: false });
            var res = JSON.parse(result);
            var urlGeo = '';
            if (res.response == "success") {
                var strmsg = '';
                switch (type) {
                    case 'loc':
                        strmsg = 'Current location has been updated';
                        break;
                    case 'home':
                        strmsg = 'Home location has been updated';
                        urlGeo = 'http://maps.googleapis.com/maps/api/geocode/json?address={0}-:US&sensor=true'.format(value);
                        break;
                    case 'other':
                        strmsg = 'Zip Code has been updated';
                        urlGeo = 'http://maps.googleapis.com/maps/api/geocode/json?address={0}-:US&sensor=true'.format(value);
                        break;
                }

            }

            if (type == 'loc') {
                //navigator.notification.alert(strmsg, alertCB, 'Location settings:', 'Accept');
                localStorage.setItem("CurrentLocation", JSON.stringify({ "type": type, "value": value }));
                //SendAlert(strmsg || 'Current location has been updated');
                strmsg = strmsg || 'Current location has been updated';
                var alertCB = function () {
                    //HomeCtrl.bannersTemp = null;
                    HomeCtrl.open(false, 'flip');
                };
                navigator.notification.alert(strmsg, alertCB, 'Location settings:', 'Accept');
            } else {
                $.ajax({ url: urlGeo, type: 'GET' })
                .done(function (results, status) {
                    if (status.toLowerCase() == "success" && results.results.length > 0) {

                        var alertCB = function () {
                            //HomeCtrl.bannersTemp = null;
                            HomeCtrl.open(false, 'flip');
                        };
                        localStorage.setItem("CurrentLocation", JSON.stringify(
                            {
                                "type": type, "value": value,
                                "latitude": results.results[0].geometry.location.lat, "longitude": results.results[0].geometry.location.lng
                            }));
                        console.log(urlGeo);
                        console.log(localStorage.getItem("CurrentLocation"));
                        navigator.notification.alert(strmsg, alertCB, 'Location settings:', 'Accept');
                    }
                })
                .error(function (err) { console.log(err); });
            }

        }).error(function (err) {
            SendAlert("Error on set location");
        });
    },
    loadData: function () {
        $("#chkCurrenLoc").attr("src", "images/unchecked.png");
        $("#chkHomeZip").attr("src", "images/unchecked.png");
        $("#chkOtherZip").attr("src", "images/unchecked.png");
        var current = JSON.parse(localStorage.getItem("CurrentLocation"));
        if (current == null) return;

        switch (current.type) {
            case 'loc':
                $("#chkCurrenLoc").attr("src", "images/checked.png");

                break;
            case 'home':
                $("#chkHomeZip").attr("src", "images/checked.png");
                $("#chkHomeZip").parent().find("label").hide();
                $("#chkHomeZip").parent().append($("<input type='text' id='txtHomeZip'/>").val(current.value));
                $("#txtHomeZip").focus(function (ev) {
                    //$("div[data-role='header']").hide();
                    //$("#location-page").css("padding-top", "0px");
                }).blur(function (ev) {
                    //var hdr = $("div[data-role='header']").height();
                    //$("div[data-role='header']").show();
                    //$("#location-page").css("padding-top", hdr + "px");
                }).keypress(function (ev) {
                    if (ev.keyCode == '13') {
                        var homezip = $("#txtHomeZip").val();
                        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                        var reqData = { "userid": crrnUsr.id, "zip": homezip, "home": "1" };
                        MyLocation.setLocation(reqData, 'home', homezip);
                    }
                });
                break;
            case 'other':
                $("#chkOtherZip").attr("src", "images/checked.png");
                $("#chkOtherZip").parent().find("label").hide();
                $("#chkOtherZip").parent().append($("<input type='text' id='txtOtherZip'/>").val(current.value));

                //fix keyboard header push
                $("#txtOtherZip").focus(function (ev) {
                    //$("div[data-role='header']").hide();
                    //$("#location-page").css("padding-top", "0px");
                    //var hdr = $("div[data-role='header']").height();
                    //var bdy = $("#location-page").height();
                    //$("#location-page").height(bdy + hdr);
                }).blur(function (ev) {
                    //var hdr = $("div[data-role='header']").height();
                    //$("div[data-role='header']").show();
                    //$("#location-page").css("padding-top", hdr + "px");
                    //var bdy = $("#location-page").height();
                    //$("#location-page").height(bdy - hdr);
                }).keypress(function (ev) {
                    if (ev.keyCode == '13') {
                        var otherzip = $("#txtOtherZip").val();
                        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
                        var reqData = { "userid": crrnUsr.id, "zip": otherzip };
                        MyLocation.setLocation(reqData, 'other', otherzip);
                    }
                });
                break;
        }
    }
};