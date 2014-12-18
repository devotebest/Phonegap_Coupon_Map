var CouponCtrl = {
    init: function () {
        $(":mobile-pagecontainer").pagecontainer("load", "coupon.html", { role: 'page', idPage: 'coupon-page' });
    },
    backAction: function () { },
    mapBackAction: function () {
        window.history.back();
    },
    crrnCouponStores: [],
    processingID: 0,
    couponDetail: function (id, reverse) {
        // alert("coupon: " + id);
        //var pg = $(":mobile-pagecontainer").pagecontainer("getActivePage").attr("id");
        //console.log(pg);
        if (CouponCtrl.processingID > 0) return;
        CouponCtrl.processingID = parseInt(id);
        reverse = reverse || false;
        CouponCtrl.mapBackAction = function () {
            CouponCtrl.couponDetail(id, true);
        };
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({
            url: urlApi('get_coupon_details.php?data=' + JSON.stringify({ coupon_id: id })),
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result).data[0];
            console.log(data);
            CouponCtrl.crrnCouponStores = data.store_name;
            //$(":mobile-pagecontainer").one("pagecontainerbeforechange", function (event, ui) {

            //});

            $(":mobile-pagecontainer").one("pagecontainerchange", function (ev, ui) {
                console.log("page changed");
                $("#imgCouponDet").attr("data-src", data.coupon_thumbnail).attr("data-src-retina", data.coupon_thumbnail).attr("src", "images/spinner.gif");
                //$("#lblExpireDate").html("Expires on <br/>" + data.expiry_date);
                $("#lblExpireDate").html("Expires on <br/>" + dates.toLiteral(dates.convert(data.expiry_date)));
                $("#lblCouponDetail").html(data.coupon_description);
                $("#lblPromoText").html(data.promo_text_long);

                $("#btnAddToMyCoupons").off("click").on("click", function () {
                    CouponCtrl.saveCoupon(id);
                });

                $("#btnRedeemNow").off("click").on("click", function () {
                    CouponCtrl.redeemDirect(data);
                });

                setTimeout(function () {
                    $("#imgCouponDet").unveil(0, function () {
                        try {
                            $(this).load(function () {
                                console.log(this.src);
                            }).error(function () {
                                console.log("Error evnt: " + $(this).attr("src"));
                                $(this).attr("src", 'images/logo_default_image2.jpg')
                            });
                        } catch (ex) {
                            console.log("Error: " + $(this).attr("src"));
                        }
                    });
                }, 200);

                $.ajax({
                    url: urlApi('get_terms_conditions.php?couponid=' + id),
                    type: 'GET'
                }).done(function (resultTC) {
                    $("#lblCouponOfferDetail").html(resultTC);
                    $("#buttonTermsContainer").html("<a class='termsCondition' href=\"javascript:navigator.notification.alert('" + resultTC + "', null, 'Terms & Conditions:','Accept');\">*TERMS & CONDITIONS APPLY</a>");
                });
                var crrnLoc = JSON.parse(localStorage.getItem("CurrentLocation"));
                if (crrnLoc) {
                    CouponCtrl.crrnLat = crrnLoc.latitude;
                    CouponCtrl.crrnLng = crrnLoc.longitude;
                } else {
                    GeoLocation.getCurrent(
                        function () {
                            CouponCtrl.crrnLat = GeoLocation.latitude;
                            CouponCtrl.crrnLng = GeoLocation.longitude;
                            //SendAlert('Lat: ' + CouponCtrl.crrnLat + ' - Lon: ' + CouponCtrl.crrnLng);
                        },
                        function () {
                            CouponCtrl.crrnLat = 0;
                            CouponCtrl.crrnLng = 0;
                        });
                }
                CouponCtrl.processingID = 0;
                //$(".coupon_box").attr("style", " border: #a8a8a8 solid 0.2em;");
                //setTimeout(function () { $(".coupon_box").attr("style", " border: #a8a8a8 dashed 0.2em;"); }, 3000);
            });

            //$(":mobile-pagecontainer").pagecontainer("load", "coupon.html", { reload: true, showLoadMsg: true });
            $(":mobile-pagecontainer").pagecontainer("change", "coupon.html", { transition: "slide", showLoadMsg: true, reverse: reverse });
        });

    },
    saveCoupon: function (coupon_id) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
        var reqData = { "userid": crrnUsr.id, "couponid": coupon_id };
        $.ajax({
            url: urlApi('add_to_my_coupons.php?data=' + JSON.stringify(reqData)),
            type: 'GET'
        }).done(function (result) {
            $.mobile.loading('hide', { textVisible: false });
            SendAlert(JSON.parse(result).message);
            CouponCtrl.backAction();
        }).error(function (err) {
            SendAlert("Error on save coupon");
        });
    },
    redeemDirect: function (obj) {
        var list = [];


        RedeemCtrl.backAction = function () {
            navigator.notification.confirm(
                'The countdown to redeem this coupon will continue even if you leave this page. If you leave your current location, this coupon will become invalid.', // message
                 function (btnIndex) {
                     if (btnIndex == 2) {
                         CouponCtrl.couponDetail(obj.id, true);
                     }
                     else {
                         return false;
                     }
                 },            // callback to invoke with index of button pressed
                ' ',           // title
                ['Cancel', 'OK']     // buttonLabels
            );
        };

        var itm = $.grep(RedeemCtrl.listCouponTemp, function (item) {
            return item.id == obj.id;
        })[0];

        if (itm == null) {
            var d = new Date();
            obj.timer = d.getTime();
            RedeemCtrl.listCouponTemp.push(obj);
            list.push(obj);
            RedeemCtrl.open(list);
        }
        else {
            list.push(itm);
            RedeemCtrl.open(list);
        }
    },
    crrnMap: null,
    crrnMarker: null,
    crrnDirServices: null,
    crrnStoreIndex: 0,
    crrnLat: null,
    crrnLng: null,
    seeStoreMap: function () {
        if (CouponCtrl.crrnCouponStores.length == 0) {
            SendAlert("No Store to show");
            return;
        }
        $(":mobile-pagecontainer").one("pagecontainershow", function () {
            $("#divStoreMap").height($("#divStoreMap").parent().height() - 110);

            var pos = new google.maps.LatLng(CouponCtrl.crrnCouponStores[0].latitude, CouponCtrl.crrnCouponStores[0].longitude);
            if (CouponCtrl.crrnLat != null && CouponCtrl.crrnLng != null) {
                CouponCtrl.crrnDirServices = new google.maps.DirectionsService();
                console.log(CouponCtrl.crrnDirServices);
                var reqRoute = {
                    origin: new google.maps.LatLng(CouponCtrl.crrnLat, CouponCtrl.crrnLng),
                    //origin: new google.maps.LatLng('25.816511', '-80.407142'),
                    destination: pos,
                    travelMode: google.maps.TravelMode.DRIVING
                };
                console.log(reqRoute);
                CouponCtrl.crrnDirServices.route(reqRoute, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        //directionsDisplay.setDirections(response);
                        $("#lblStoreMapDistance").html(response.routes[0].legs[0].distance.text.replace('mi', 'miles away'));

                    }
                });
            }
            var mapOptions = {
                zoom: 14,
                center: pos,
                disableDefaultUI: true
            };
            CouponCtrl.crrnMap = new google.maps.Map(document.getElementById('divStoreMap'),
                mapOptions);

            setTimeout(function () {
                CouponCtrl.crrnMarker = new google.maps.Marker({
                    position: pos,
                    map: CouponCtrl.crrnMap,
                    icon: {
                        url: 'images/marker.png',
                        size: new google.maps.Size(40, 70),
                        scaledSize: new google.maps.Size(40, 70),
                        origin: new google.maps.Point(0, 0),
                        // The anchor for this image is the base of the flagpole at 0,32.
                        anchor: new google.maps.Point(0, 32)
                    },
                    optimized: false
                });
            }, 300);

            $("#imgLogoStoreMap").attr("src", CouponCtrl.crrnCouponStores[0].storethumbnail);
            $("#lblStoreMapName").html(CouponCtrl.crrnCouponStores[0].storename);
            $("#lblStoreMapAddress").html(CouponCtrl.crrnCouponStores[0].address);
            $("#lblStoreMapPhone").html(CouponCtrl.crrnCouponStores[0].phone);
            $("#lblStoreMapCounter").html("{0} of {1}".format(1, CouponCtrl.crrnCouponStores.length));
            $("#lblStoreMapDistance").html("...");
            CouponCtrl.crrnStoreIndex = 0;
        });
        $(":mobile-pagecontainer").pagecontainer("change", "store_map.html", { transition: "slide", showLoadMsg: true });

    },
    nextStore: function () {
        if (CouponCtrl.crrnStoreIndex == CouponCtrl.crrnCouponStores.length - 1) return;
        CouponCtrl.crrnStoreIndex++;
        var idx = CouponCtrl.crrnStoreIndex;
        var pos = new google.maps.LatLng(CouponCtrl.crrnCouponStores[idx].latitude, CouponCtrl.crrnCouponStores[idx].longitude);
        CouponCtrl.crrnMap.panTo(pos);
        CouponCtrl.crrnMarker.setPosition(pos);

        $("#imgLogoStoreMap").attr("src", CouponCtrl.crrnCouponStores[idx].storethumbnail);
        $("#lblStoreMapName").html(CouponCtrl.crrnCouponStores[idx].storename);
        $("#lblStoreMapAddress").html(CouponCtrl.crrnCouponStores[idx].address);
        $("#lblStoreMapPhone").html(CouponCtrl.crrnCouponStores[idx].phone);
        $("#lblStoreMapDistance").html("...");
        $("#lblStoreMapCounter").html("{0} of {1}".format((idx + 1), CouponCtrl.crrnCouponStores.length));

        if (CouponCtrl.crrnLat != null && CouponCtrl.crrnLng != null) {
            CouponCtrl.crrnDirServices = new google.maps.DirectionsService();
            console.log(CouponCtrl.crrnDirServices);
            var reqRoute = {
                //origin: new google.maps.LatLng(CouponCtrl.crrnLat, CouponCtrl.crrnLng),
                origin: new google.maps.LatLng('25.816511', '-80.407142'),
                destination: pos,
                travelMode: google.maps.TravelMode.DRIVING
            };
            console.log(reqRoute);
            CouponCtrl.crrnDirServices.route(reqRoute, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    //directionsDisplay.setDirections(response);
                    $("#lblStoreMapDistance").html(response.routes[0].legs[0].distance.text.replace('mi', 'miles away'));

                }
            });
        }
    },
    prevStore: function () {
        if (CouponCtrl.crrnStoreIndex == 0) return;
        CouponCtrl.crrnStoreIndex--;
        var idx = CouponCtrl.crrnStoreIndex;
        var pos = new google.maps.LatLng(CouponCtrl.crrnCouponStores[idx].latitude, CouponCtrl.crrnCouponStores[idx].longitude);
        CouponCtrl.crrnMap.panTo(pos);
        CouponCtrl.crrnMarker.setPosition(pos);

        $("#imgLogoStoreMap").attr("src", CouponCtrl.crrnCouponStores[idx].storethumbnail);
        $("#lblStoreMapName").html(CouponCtrl.crrnCouponStores[idx].storename);
        $("#lblStoreMapAddress").html(CouponCtrl.crrnCouponStores[idx].address);
        $("#lblStoreMapPhone").html(CouponCtrl.crrnCouponStores[idx].phone);
        $("#lblStoreMapDistance").html("...");
        $("#lblStoreMapCounter").html("{0} of {1}".format((idx + 1), CouponCtrl.crrnCouponStores.length));

        if (CouponCtrl.crrnLat != null && CouponCtrl.crrnLng != null) {
            CouponCtrl.crrnDirServices = new google.maps.DirectionsService();
            console.log(CouponCtrl.crrnDirServices);
            var reqRoute = {
                //origin: new google.maps.LatLng(CouponCtrl.crrnLat, CouponCtrl.crrnLng),
                origin: new google.maps.LatLng('25.816511', '-80.407142'),
                destination: pos,
                travelMode: google.maps.TravelMode.DRIVING
            };
            console.log(reqRoute);
            CouponCtrl.crrnDirServices.route(reqRoute, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    //directionsDisplay.setDirections(response);
                    $("#lblStoreMapDistance").html(response.routes[0].legs[0].distance.text.replace('mi', 'miles away'));

                }
            });
        }
    },
};