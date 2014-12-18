var MyCoupons = {
    initData: {},
    arraySelCoupons: [],
    loadDeferred: null,
    init: function () {
        //$(":mobile-pagecontainer").pagecontainer("load", "mycoupons.html", { role: 'page' });
        //this.loadEvents();
    },
    open: function (order, reverse, transition) {
        order = order || 0;
        reverse = reverse || false;
        transition = transition || "slide";
        MyCoupons.arraySelCoupons = [];
        MyCoupons.loadDeferred = $.Deferred();


        //before load all the DOM
        if ($("#mycoupons-page").get(0)) {
            $("#mycoupons-page").remove();
        }
        $(":mobile-pagecontainer").one("pagecontainerload", function (event, ui) {
            MyCoupons.loadData(order);
        });
        $(":mobile-pagecontainer").pagecontainer("load", "mycoupons.html", {});

        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            //SendAlert("sdasdd");
        });

        $.when(MyCoupons.loadDeferred).then(function () {
            $(":mobile-pagecontainer").pagecontainer("change", "#mycoupons-page", { transition: transition, reverse: reverse, showLoadMsg: true });
        });

        //MyCoupons.loadData();
    },
    loadEvents: function (order) {
        order = order || 0;
        CouponCtrl.backAction = function () {
            MyCoupons.open(0, true);
        };
        bindGestures();
        $("#btnMyCouponAZ").off("click").on("click", function () {
            MyCoupons.orderAZ();
            CouponCtrl.backAction = function () {
                MyCoupons.open(0, true);
            };
            RedeemCtrl.backAction = function () {
                navigator.notification.confirm(
                    'The countdown to redeem this coupon will continue even if you leave this page. If you leave your current location, this coupon will become invalid.', // message
                     function (btnIndex) {
                         if (btnIndex == 2) {
                             // OK
                             clearInterval(RedeemCtrl.intervalCountDown);
                             MyCoupons.open(0, true);
                         }
                         else {
                             return false;
                         }
                     },            // callback to invoke with index of button pressed
                    ' ',           // title
                    ['Cancel', 'OK']     // buttonLabels
                );
            };
            MyCoupons.backSearchCoupons = function () {
                MyCoupons.open(0, true);
            };
        });
        $("#btnMyCouponPercent").off("click").on("click", function () {
            MyCoupons.orderOFF();
            CouponCtrl.backAction = function () {
                MyCoupons.open(1, true);
            };
            MyCoupons.backSearchCoupons = function () {
                MyCoupons.open(1, true);
            };
            RedeemCtrl.backAction = function () {
                navigator.notification.confirm(
                    'The countdown to redeem this coupon will continue even if you leave this page. If you leave your current location, this coupon will become invalid.', // message
                     function (btnIndex) {
                         if (btnIndex == 2) {
                             // OK
                             MyCoupons.open(1, true);
                         }
                         else {
                             return false;
                         }
                     },            // callback to invoke with index of button pressed
                    ' ',           // title
                    ['Cancel', 'OK']     // buttonLabels
                );
            };
        });
        $("#btnMyCouponCia").off("click").on("click", function () {
            MyCoupons.orderCompany();
            CouponCtrl.backAction = function () {
                MyCoupons.open(2, true);
            };
            MyCoupons.backSearchCoupons = function () {
                MyCoupons.open(2, true);
            };
            RedeemCtrl.backAction = function () {
                navigator.notification.confirm(
                    'The countdown to redeem this coupon will continue even if you leave this page. If you leave your current location, this coupon will become invalid.', // message
                     function (btnIndex) {
                         if (btnIndex == 2) {
                             // OK
                             MyCoupons.open(2, true);
                         }
                         else {
                             return false;
                         }
                     },            // callback to invoke with index of button pressed
                    ' ',           // title
                    ['Cancel', 'OK']     // buttonLabels
                );
            };
        });
        $("#btnMyCouponExp").off("click").on("click", function () {
            MyCoupons.orderExp();
            CouponCtrl.backAction = function () {
                MyCoupons.open(3, true);
            };
            MyCoupons.backSearchCoupons = function () {
                MyCoupons.open(3, true);
            };
            RedeemCtrl.backAction = function () {
                navigator.notification.confirm(
                    'The countdown to redeem this coupon will continue even if you leave this page. If you leave your current location, this coupon will become invalid.', // message
                     function (btnIndex) {
                         if (btnIndex == 2) {
                             // OK
                             MyCoupons.open(3, true);
                         }
                         else {
                             return false;
                         }
                     },            // callback to invoke with index of button pressed
                    ' ',           // title
                    ['Cancel', 'OK']     // buttonLabels
                );
            };
        });


        switch (order) {
            case 1:
                $("#btnMyCouponPercent").trigger("click");
                break;
            case 2:
                $("#btnMyCouponCia").trigger("click");
                break;
            case 3:
                $("#btnMyCouponExp").trigger("click");
                break;
            default:
                $("#btnMyCouponAZ").trigger("click");
                break;
        }
    },
    loadData: function (order) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
        var reqData = { "userid": crrnUsr.id };
        $.ajax({ url: urlApi('mycoupons.php?data=' + JSON.stringify(reqData)), type: 'GET' })
        .done(function (result) {
            var conv = JSON.parse(result);
            MyCoupons.initData = conv.response ? {} : conv;
            //MyCoupons.processData(conv);
            //MyCoupons.orderAZ();
            MyCoupons.loadEvents(order);
        });
    },
    processData: function (data) {
        try {
            $.Mustache.load('js/views/MyCoupons.html').fail(function () {
                SendAlert('Failed to load templates');
            }).done(function () {

                var content = $.Mustache.render('mycoupons-list', { list: data.data });
                $("#mycouponscont").html(content);
                $("#listContent").listview();
                $('#listContent [type="button"]').button();

                $('#mycoupons-page img.imgLazy').batchImageLoad({
                    loadingCompleteCallback: function () { MyCoupons.loadDeferred.resolve(); },
                    imageLoadedCallback: function (count, total) { console.log("{0} of {1}".format(count, total)); }
                });

                MyCoupons.checkSelected();
                $.mobile.loading('hide', { textVisible: false });
            });
        } catch (ex) {
            SendAlert("Exception: " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    check: function (ctrl, btnRedeemId) {
        var selId = $(ctrl).data("idcoupon");
        var idx = MyCoupons.arraySelCoupons.indexOf(selId);
        if (idx < 0) {
            MyCoupons.arraySelCoupons.push(selId);
            $(ctrl).attr("src", "images/check2.png");
            $(btnRedeemId).button('disable');
        } else {
            MyCoupons.arraySelCoupons.splice(idx, 1);
            $(ctrl).attr("src", "images/uncheck2.png");
            $(btnRedeemId).button('enable');
        }

        if (MyCoupons.arraySelCoupons.length > 0) {
            $("#btnRedemSelected").prop("disabled", false);
        } else {
            $("#btnRedemSelected").prop("disabled", true);
        }
        event.preventDefault();
        event.stopPropagation();
    },
    checkSelected: function () {
        $("#listContent .check-coupon img").each(function () {
            var selId = $(this).data("idcoupon");
            var idx = MyCoupons.arraySelCoupons.indexOf(selId);
            if (idx < 0) {
                $(this).attr("src", "images/uncheck2.png");
                $("#btnRedem_" + selId).button('enable');
            } else {
                $(this).attr("src", "images/check2.png");
                $("#btnRedem_" + selId).button('disable');
            }

            if (MyCoupons.arraySelCoupons.length > 0) {
                $("#btnRedemSelected").prop("disabled", false);
            } else {
                $("#btnRedemSelected").prop("disabled", true);
            }
        });
    },
    orderAZ: function () {
        var pre = $.extend(true, {}, MyCoupons.initData);
        if (pre && pre.data) {
            if (pre.data.length > 0) {
                pre.data.sort(function (a, b) {
                    var aName = a.name.toLowerCase();
                    var bName = b.name.toLowerCase();
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                });
                setTimeout(function () { MyCoupons.processData(pre); }, 200);
            }
            else {
                MyCoupons.processData([]);
            }
        }
        else {
            MyCoupons.processData([]);
        }
    },
    orderOFF: function () {
        var pre = $.extend(true, {}, MyCoupons.initData);
        if (pre && pre.data) {
            if (pre.data.length > 0) {
                pre.data.sort(function (a, b) {
                    var aName = a.promo_text_short;
                    var bName = b.promo_text_short;
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                });
                setTimeout(function () { MyCoupons.processData(pre); }, 200);
            }
            else {
                MyCoupons.processData([]);
            }
        }
        else {
            MyCoupons.processData([]);
        }
    },
    orderCompany: function () {
        var pre = $.extend(true, {}, MyCoupons.initData);
        if (pre && pre.data) {
            if (pre.data.length > 0) {
                pre.data.sort(function (a, b) {
                    var aName = a.customer_name.toLowerCase();
                    var bName = b.customer_name.toLowerCase();
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                });
                setTimeout(function () { MyCoupons.processData(pre); }, 200);
            }
            else {
                MyCoupons.processData([]);
            }
        }
        else {
            MyCoupons.processData([]);
        }
    },
    orderExp: function () {
        var pre = $.extend(true, {}, MyCoupons.initData);
        if (pre && pre.data) {
            if (pre.data.length > 0) {
                pre.data.sort(function (a, b) {
                    var aDate = a.expiry_date;
                    var bDate = b.expiry_date;
                    return dates.compare(bDate, aDate);
                });
                setTimeout(function () { MyCoupons.processData(pre); }, 200);
            }
            else {
                MyCoupons.processData([]);
            }
        }
        else {
            MyCoupons.processData([]);
        }
    },
    redeem: function (id) {
        event.preventDefault();
        event.stopPropagation();

        var list = [];

        var itm = $.grep(RedeemCtrl.listCouponTemp, function (item) {
            return item.id == id;
        })[0];

        if (itm == null) {
            var itmAux = $.grep(MyCoupons.initData.data, function (item) {
                return item.id == id;
            })[0];

            if (itmAux != null) {
                var d = new Date();
                itmAux.timer = d.getTime();
                RedeemCtrl.listCouponTemp.push(itmAux);
                list.push(itmAux);
                RedeemCtrl.open(list);
            }
        }
        else {
            list.push(itm);
            RedeemCtrl.open(list);
        }
    },
    redeemSelected: function () {
        if (MyCoupons.arraySelCoupons.length > 0) {
            var d = new Date();
            var time = d.getTime();
            var list = [];

            MyCoupons.arraySelCoupons.forEach(function (itm) {
                var itmAux = null;
                RedeemCtrl.listCouponTemp = RedeemCtrl.listCouponTemp || [];
                if (RedeemCtrl.listCouponTemp.length > 0) {
                    itmAux = $.grep(RedeemCtrl.listCouponTemp, function (item) {
                        if (item == null) {
                            return false;
                        }
                        return parseInt(item.id) == parseInt(itm);
                    })[0];
                }

                if (itmAux == null) {
                    var aux2 = $.grep(MyCoupons.initData.data, function (item) {
                        return parseInt(item.id) == parseInt(itm);
                    })[0];

                    if (aux2 != null) {
                        itmAux = aux2;
                        itmAux.timer = time;
                        RedeemCtrl.listCouponTemp.push(itmAux);
                    }
                }
                else {
                    var pos = RedeemCtrl.listCouponTemp.indexOf(itmAux);
                    RedeemCtrl.listCouponTemp[pos].timer = time;
                }
                list.push(itmAux);
            });
            console.log(JSON.stringify(list));
            RedeemCtrl.open(list);
        }
    },
    openSearchCoupons: function (filter) {

        filter = filter || "";

        $(":mobile-pagecontainer").one("pagecontainerbeforeload", function (event, ui) {
            $.mobile.loading('hide', { textVisible: false });
        });
        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            $.mobile.loading('hide', { textVisible: false });
            $("#txtSearchMyCoupons").val(filter);
            MyCoupons.EventSearchCoupons();
            setTimeout(function () { $.mobile.loading('hide', { textVisible: false }); }, 1000);
        });
        setTimeout(function () { $.mobile.loading('hide', { textVisible: false }); }, 1000);

        $(":mobile-pagecontainer").pagecontainer("change", "searchmycoupons.html", { transition: "slideup", showLoadMsg: false, reverse: false });

    },
    backSearchCoupons: function () { },
    EventSearchCoupons: function () {
        try {
            var filter = $("#txtSearchMyCoupons").val();
            var filter1 = $("#txtSearchMyCoupons").val();
            CouponCtrl.backAction = function () {
                MyCoupons.openSearchCoupons(filter1);
            };
            filter = filter.toUpperCase();

            $("#listContentsearchycoupons").html("");
            if (filter.length > 0) {
                var pre = $.extend(true, {}, MyCoupons.initData);
                if (pre.data) {
                    if (pre.data.length > 0) {

                        var filtered = $.grep(pre.data, function (item) {
                            if (item == null) {
                                return false;
                            }
                            if (item.customer_name.toUpperCase().indexOf(filter) > -1) {
                                return true;
                            }
                            if (item.promo_text_short.toUpperCase().indexOf(filter) > -1) {
                                return true;
                            }
                            return false;
                        });

                        setTimeout(function () { MyCoupons.loadDataSearch(filtered); }, 200);
                    }
                    else {
                        MyCoupons.loadDataSearch([]);
                    }
                }
                else {
                    MyCoupons.loadDataSearch([]);
                }
            }
            else {
                $("#mainSearchMyCoupon").removeClass("done");
            }

        } catch (ex) {
            SendAlert("Ops! " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    loadDataSearch: function (data) {
        $("#mainSearchMyCoupon").addClass("done");
        if (data.length > 0) {
            try {
                $.Mustache.load('js/views/MyCoupons.html').fail(function () {
                    SendAlert('Failed to load templates');
                }).done(function () {
                    var content = $.Mustache.render('searchmycoupons-list', { list: data });
                    $("#listContentsearchycoupons").html(content);
                    $("#listContentsearchmycoupons").listview();

                    $('#searchmycoupons-page img.imgLazy').batchImageLoad({
                        loadingCompleteCallback: function () { MyCoupons.loadDeferred.resolve(); },
                        imageLoadedCallback: function (count, total) { console.log("{0} of {1}".format(count, total)); }
                    });
                    $.mobile.loading('hide', { textVisible: false });
                });
            } catch (ex) {
                $("#listContentsearchycoupons").html("");
                SendAlert("Exception: " + ex.message);
                $.mobile.loading('hide', { textVisible: false });
            }
        }
        else {
            $("#listContentsearchycoupons").html("");
        }
    }
};