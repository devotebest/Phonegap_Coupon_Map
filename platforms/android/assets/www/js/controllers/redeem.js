var RedeemCtrl = {
    intervalCountDown: {},
    listCouponTemp: [],
    listCouponToShow: [],
    back: function () {
        RedeemCtrl.backAction();
    },
    backAction: function () { },
    open: function (listToShow, reverse, transition) {
        listToShow = listToShow || [];
        RedeemCtrl.listCouponToShow = listToShow;
        reverse = reverse || false;
        transition = transition || "slide";
        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            RedeemCtrl.showData(listToShow);
            setTimeout(function () { $.mobile.loading('hide', { textVisible: false }); }, 1000);
        });
        $(":mobile-pagecontainer").pagecontainer("change", "redeem.html", { transition: transition, showLoadMsg: true, reverse: reverse });
    },
    startCountDown: function (countdowlabel, target_date) {
        // set the date we're counting down to
        //var target_date = RedeemCtrl.listCouponTemp[0].timer + 3600000;
        // variables for time units
        var days, hours, minutes, seconds;
        // get tag element
        var countdown = document.getElementById(countdowlabel);
        // update the tag with id "countdown" every 1 second
        RedeemCtrl.intervalCountDown = setInterval(function () {
            // find the amount of "seconds" between now and target
            var current_date = new Date().getTime();
            var seconds_left = (target_date - current_date) / 1000;
            // do some time calculations
            days = parseInt(seconds_left / 86400);
            seconds_left = seconds_left % 86400;

            hours = parseInt(seconds_left / 3600);
            seconds_left = seconds_left % 3600;

            minutes = parseInt(seconds_left / 60);
            seconds = parseInt(seconds_left % 60);

            // format countdown string + set tag value
            //countdown.innerHTML = days + "d, " + hours + "h, "
            //+ minutes + "m, " + seconds + "s";
            countdown.innerHTML = (minutes.toString().length == 1 ? "0" + minutes : minutes) + ":" + (seconds.toString().length == 1 ? "0" + seconds : seconds) + " min left";

            if (minutes <= 0 && seconds <= 0) {
                countdown.innerHTML = "00:00 min left";

                // stop countDown
                clearInterval(RedeemCtrl.intervalCountDown);
                // Remove from coupons
                RedeemCtrl.timeOut(0);
            }
        }, 1000);
    },
    showData: function () {
        var timeToWait = 3600000; //60000 3600000
        RedeemCtrl.listCouponToShow || [];
        if (RedeemCtrl.listCouponToShow.length > 1) {
            try {
                $.Mustache.load('js/views/MyCoupons.html').fail(function () {
                    SendAlert('Failed to load templates');
                }).done(function () {
                    $("#listCouponsContainer").html($.Mustache.render('redeemcoupon-list', { list: RedeemCtrl.listCouponToShow }));

                    var itm = $.grep(RedeemCtrl.listCouponTemp, function (item) {
                        return item.id == RedeemCtrl.listCouponToShow[0].id;
                    })[0];

                    RedeemCtrl.startCountDown('countDownRedeem', itm.timer + timeToWait);

                    $("#listCouponsContainer a.redeemcouponitm").each(function () {
                        var btn = $(this);
                        var reqData = { "coupon_id": $(this).data("idcoupon") };
                        var url = urlApi('get_coupon_details.php?data=' + JSON.stringify(reqData));
                        $.ajax({ url: url, type: 'GET' }).done(function (result) {
                            var conv = JSON.parse(result);
                            if (conv.response) {
                                return false;
                            }
                            btn.attr("href", "javascript:navigator.notification.alert('" + conv.data[0].terms_conditions + "', null, 'Terms & Conditions:','Accept');");
                            var barcodeContainer = btn.closest("table").find("div.barcode").first();

                            if (conv.data[0].bar_type && conv.data[0].barcodedata) {
                                if (conv.data[0].bar_type.toUpperCase() != "QR") {
                                    barcodeContainer.barcode(conv.data[0].barcodedata, conv.data[0].bar_type, { barWidth: 1, barHeight: 70 });
                                }
                                else {
                                    barcodeContainer.html("<p style='margin: 0px; padding: 20px 0px;'>Coupon code:" + conv.data[0].couponcode + "</p>");
                                }
                            }
                            else {
                                barcodeContainer.html("<p style='margin: 0px; padding: 20px 0px;'>Coupon code:" + conv.data[0].couponcode + "</p>");
                            }
                        });
                    });
                    $.mobile.loading('hide', { textVisible: false });
                });
            } catch (ex) {
                SendAlert("Exception: " + ex.message);
                $.mobile.loading('hide', { textVisible: false });
            }
        }
        else {
            try {
                var itm = $.grep(RedeemCtrl.listCouponTemp, function (item) {
                    return item.id == RedeemCtrl.listCouponToShow[0].id;
                })[0];

                RedeemCtrl.startCountDown('countDownRedeem', itm.timer + timeToWait);
                var reqData = { "coupon_id": itm.id };
                var url = urlApi('get_coupon_details.php?data=' + JSON.stringify(reqData));
                $.ajax({ url: url, type: 'GET' }).done(function (result) {
                    var conv = JSON.parse(result);
                    if (conv.response) {
                        return false;
                    }

                    if (conv.data[0].bar_type && conv.data[0].barcodedata) {
                        if (conv.data[0].bar_type.toUpperCase() != "QR") {
                            $("#redeemImage").barcode(conv.data[0].barcodedata, conv.data[0].bar_type, { barWidth: 1, barHeight: 80 });
                        }
                        else {
                            $("#redeemImage").html("<p style='margin: 0px; padding: 20px 0px;'>Coupon code:" + conv.data[0].couponcode + "</p>");
                        }
                    }
                    else {
                        $("#redeemImage").html("<p style='margin: 0px; padding: 20px 0px;'>Coupon code:" + conv.data[0].couponcode + "</p>");
                    }
                    $("#redeemImageThumb").attr("src", conv.data[0].coupon_thumbnail);
                    $("#redeemName").html(conv.data[0].name);
                    $("#redeemPromoTextLong").html(conv.data[0].promo_text_long);
                    $("#redeemPromoTextShort").html(conv.data[0].promo_text_short);
                    $("#redeemCustomerName").html(conv.data[0].customer_name);
                    $("#redeemExpiry_date").html(dates.toLiteral(dates.convert(conv.data[0].expiry_date)));
                    $("#redeemTerms").attr("href", "javascript:navigator.notification.alert('" + conv.data[0].terms_conditions + "', null, 'Terms & Conditions:','Accept');");
                });
            }
            catch (ex) {
                SendAlert("Exception: " + ex.message);
                $.mobile.loading('hide', { textVisible: false });
            }
        }
    },
    redeem: function (idx) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });

        //action after finished
        if (idx == RedeemCtrl.listCouponToShow.length) {
            CouponCtrl.backAction();
        } else {
            var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
            var reqData = { "userid": crrnUsr.id, "couponid": RedeemCtrl.listCouponToShow[idx].id };
            $.ajax({
                url: urlApi('redeem_coupon.php?data=' + JSON.stringify(reqData)),
                type: 'GET'
            }).done(function (result) {
                var itmToRemove = $.grep(RedeemCtrl.listCouponTemp, function (item) {
                    return item.id == RedeemCtrl.listCouponToShow[idx].id;
                })[0];
                RedeemCtrl.listCouponTemp.splice(RedeemCtrl.listCouponTemp.indexOf(itmToRemove), 1);

                $.mobile.loading('hide', { textVisible: false });
                SendAlert(JSON.parse(result).message);
                RedeemCtrl.redeem(++idx);
            }).error(function (err) {
                SendAlert("Error on redeem coupon.");
            });
        }
    },
    preRedeem: function () {
        navigator.notification.confirm(
                    'By clicking OK, You understand that this coupon will be marked as redeemed and permanently removed from your phone.', // message
                     function (btnIndex) {
                         if (btnIndex == 2) {
                             // OK
                             clearInterval(RedeemCtrl.intervalCountDown);
                             RedeemCtrl.redeem(0);
                         }
                         else {
                             return false;
                         }
                     },            // callback to invoke with index of button pressed
                    ' ',           // title
                    ['Cancel', 'OK']     // buttonLabels
                );
    },
    timeOut: function (idx) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });

        //action after finished
        if (idx == RedeemCtrl.listCouponToShow.length) {
            CouponCtrl.backAction();
        } else {
            var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
            var reqData = { "userid": crrnUsr.id, "couponid": RedeemCtrl.listCouponToShow[idx].id };
            $.ajax({
                url: urlApi('remove_from_mycoupon.php?data=' + JSON.stringify(reqData)),
                type: 'GET'
            }).done(function (result) {
                var itmToRemove = $.grep(RedeemCtrl.listCouponTemp, function (item) {
                    return item.id == RedeemCtrl.listCouponToShow[idx].id;
                })[0];
                RedeemCtrl.listCouponTemp.splice(RedeemCtrl.listCouponTemp.indexOf(itmToRemove), 1);

                $.mobile.loading('hide', { textVisible: false });
                SendAlert(JSON.parse(result).message);
                RedeemCtrl.redeem(++idx);
            }).error(function (err) {
                SendAlert("Error on remove coupon.");
            });
        }
    }
};