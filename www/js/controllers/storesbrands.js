var StoBraCtrl = {
    open: function (reverse, transition, idClick) {
        reverse = reverse || false;
        transition = transition || 'slide';
        idClick = idClick || "btnSABStores";
        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            setTimeout(function () { $.mobile.loading('hide', { textVisible: false }); }, 500);
            bindGestures();
            $("#" + idClick).click();
        });
        $(":mobile-pagecontainer").pagecontainer("change", "stores_brands.html", { transition: transition, showLoadMsg: true, reverse: reverse });
    },
    loadByStores: function () {
        var user = JSON.parse(localStorage.getItem("CurrentUser"));
        var reqData = { 'userid': user.id };
        var strUrl = urlApi('get_nearby_stores.php?data=' + JSON.stringify(reqData));
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.data) {
                $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
                StoBraCtrl.crrnDirServices = new google.maps.DirectionsService();
                StoBraCtrl.calculateDistance(data.data, 0);
            }
            else {
                StoBraCtrl.proccessData([]);
            }
        }).error(function () {
            SendAlert("Failed to load data.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    loadByBrands: function () {
        try {
            var user = JSON.parse(localStorage.getItem("CurrentUser"));
            var reqData = { 'userid': user.id };
            var strUrl = urlApi('get_nearby_brands.php?data=' + JSON.stringify(reqData));
            $.ajax({
                url: strUrl,
                type: 'GET'
            }).done(function (result) {
                var data = JSON.parse(result);
                if (data.data) {
                    $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
                    StoBraCtrl.proccessData(data.data, 'brand');
                }
                else {
                    StoBraCtrl.proccessData([]);
                }
            }).error(function () {
                SendAlert("Failed to load data.");
                $.mobile.loading('hide', { textVisible: false });
            });
        }
        catch (err) {
            SendAlert("Error on load brands.");
        }
    },
    proccessData: function (data, type) {
        try {
            $.Mustache.load('js/views/Stores.html').fail(function () {
                SendAlert('Failed to load templates');
            }).done(function () {
                var $allcoupons = $("#storesbrandscont");
                $allcoupons.html("");
                var count = 0;
                var row = null;
                $.each(data, function (idx, itm) {
                    if (type == 'store')
                        itm.on_click = 'StoBraCtrl.showStoreCoupons("{0}")'.format(itm.storeid);
                    else
                        itm.on_click = 'StoBraCtrl.showBrandCoupons("{0}")'.format(itm.storeid);

                    switch (count) {
                        case 0:
                            row = $("<div class='ui-grid-b pull_bottom' />");
                            row.append($.Mustache.render('coupon-a', itm));
                            count++;
                            break;
                        case 1:
                            row.append($.Mustache.render('coupon-b', itm));
                            count++;
                            break;
                        case 2:
                            row.append($.Mustache.render('coupon-c', itm));
                            $allcoupons.append(row);
                            count = 0;
                            break;
                    }
                    if (count <= 2 && idx == data.length - 1) {
                        $allcoupons.append(row);
                    }
                });

                $("#storesbrandscouponcont").find(".prd_name").each(function () {
                    if ($(this).html().length > 14) {
                        $(this).css("font-size", "9px");
                    } else {
                        $(this).css("font-size", "9px");
                    }
                });
                if (data.length == 0) {
                    $allcoupons.html("<div class='nodata'>There are no coupons available, please check back later.</div>");
                }
                $.mobile.loading('hide', { textVisible: false });
            });
        }
        catch (err) {
            SendAlert("Error on load coupons.");
        }
    },
    crrnDirServices: null,
    calculateDistance: function (data, idx) {
        if (data.length == idx) {
            StoBraCtrl.proccessData(data, 'store');
            return;
        }
        var crrnLoc = JSON.parse(localStorage.getItem("CurrentLocation"));
        if (crrnLoc) {
            var pos = new google.maps.LatLng(data[idx].latitude, data[idx].longitude);
            var reqRoute = {
                origin: new google.maps.LatLng(crrnLoc.latitude, crrnLoc.longitude),
                destination: pos,
                travelMode: google.maps.TravelMode.DRIVING
            };
            console.log(reqRoute);
            StoBraCtrl.crrnDirServices.route(reqRoute, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    //directionsDisplay.setDirections(response);
                    data[idx].str_distance = response.routes[0].legs[0].distance.text.replace('mi', 'miles away');
                    StoBraCtrl.calculateDistance(data, ++idx);
                }
            });
        }
    },
    showStoreCoupons: function (storeid) {
        //get_retailer_coupons.php?data=%7b"retailer_id":"210"%7d
        var reqData = { 'retailer_id': storeid };
        var strUrl = urlApi('get_retailer_coupons.php?data=' + JSON.stringify(reqData));
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.data) {
                $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });

                $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function (event, ui) {

                    $.Mustache.load('js/views/Stores.html').fail(function () {
                        SendAlert('Failed to load templates');
                    }).done(function () {
                        StoBraCtrl.storesBrandsCouponsBackAction = function () {
                            StoBraCtrl.open(true, 'slide', 'btnSABStores');
                        };
                        var $allcoupons = $("#storesbrandscouponscont");
                        $allcoupons.html("");
                        var count = 0;
                        var row = null;
                        CouponCtrl.backAction = function () {
                            StoBraCtrl.showStoreCoupons(storeid);
                        };

                        $.each(data.data, function (idx, itm) {
                            itm.str_distance = itm.name;
                            itm.storethumbnail = itm.coupon_thumbnail;
                            itm.on_click = 'CouponCtrl.couponDetail("{0}");'.format(itm.id);
                            console.log(itm);
                            switch (count) {
                                case 0:
                                    row = $("<div class='ui-grid-b pull_bottom' />");
                                    row.append($.Mustache.render('coupon-a', itm));
                                    count++;
                                    break;
                                case 1:
                                    row.append($.Mustache.render('coupon-b', itm));
                                    count++;
                                    break;
                                case 2:
                                    row.append($.Mustache.render('coupon-c', itm));
                                    $allcoupons.append(row);
                                    count = 0;
                                    break;
                            }
                            if (count <= 2 && idx == data.data.length - 1) {
                                $allcoupons.append(row);
                            }
                        });
                        if (data.data.length == 0) {
                            $allcoupons.html("<div class='nodata'>There are no coupons available, please check back later.</div>");
                        }
                        $("#storebrandscouponsheader").html('Stores');
                        $.mobile.loading('hide', { textVisible: false });
                    });

                });
                $(":mobile-pagecontainer").pagecontainer("change", "stores_brands.coupons.html", { transition: 'slide', showLoadMsg: true });
            }
            else {

            }
        }).error(function () {
            SendAlert("Failed to load data.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    showBrandCoupons: function (storeid) {
        //get_retailer_coupons.php?data=%7b"retailer_id":"210"%7d
        var reqData = { 'retailer_id': storeid };
        var strUrl = urlApi('get_retailer_coupons.php?data=' + JSON.stringify(reqData));
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.data) {
                $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });

                $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function (event, ui) {

                    $.Mustache.load('js/views/Stores.html').fail(function () {
                        SendAlert('Failed to load templates');
                    }).done(function () {
                        StoBraCtrl.storesBrandsCouponsBackAction = function () {
                            StoBraCtrl.open(true, 'slide', 'btnSABBrands');
                        };
                        var $allcoupons = $("#storesbrandscouponscont");
                        $allcoupons.html($.Mustache.render('coupon-store-brand-list', { list: data.data }));
                        $("#lstStoBraCoupon").listview().listview("refresh");
                        CouponCtrl.backAction = function () {
                            StoBraCtrl.showBrandCoupons(storeid);
                        };
                        if (data.data.length == 0) {
                            $allcoupons.html("<div class='nodata'>There are no coupons available, please check back later.</div>");
                        }
                        $("#storebrandscouponsheader").html('Brands');
                        $.mobile.loading('hide', { textVisible: false });
                    });

                });
                $(":mobile-pagecontainer").pagecontainer("change", "stores_brands.coupons.html", { transition: 'slide', showLoadMsg: true });
            }
            else {

            }
        }).error(function () {
            SendAlert("Failed to load data.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    storesBrandsCouponsBackAction: function () {

    }
}