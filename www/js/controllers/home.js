
var HomeCtrl = {
    myScrolls: [],
    loadDeferred: null,
    open: function (reverse, transition) {
        reverse = reverse || false;
        transition = transition || "slide";
        HomeCtrl.backActionAllCoupons = function () {
            HomeCtrl.open(true);
        };
        CouponCtrl.backAction = function () {
            HomeCtrl.open(true);
            //window.history.back();
        };

        HomeCtrl.loadDeferred = $.Deferred();

        $(":mobile-pagecontainer").one("pagecontainerchange", function () {
            $("#wrapper").height($("#homeContent").height());
            pullDownLoaded();
            setTimeout(function () {
            HomeCtrl.adjustHomeCoupons();
            }, 300);
            closeSplash();
            $.mobile.loading('hide', { textVisible: false });

            //$('#homeContent').on('swipedown', function () {
            //    HomeCtrl.partialLoad();
            //});
        });
        $.when(HomeCtrl.loadDeferred).then(function () {
            $(":mobile-pagecontainer").pagecontainer("change", "#index-page", { transition: transition, showLoadMsg: true, reverse: reverse });
        });
        HomeCtrl.pageLoad();
    },
    pageLoad: function () {
        //$.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        //HomeCtrl.loadHomeData({});
        var crrnLoc = JSON.parse(localStorage.getItem("CurrentLocation"));
        if (crrnLoc) {
            if (crrnLoc.type == 'loc') {
                HomeCtrl.loadHomeData({});
                GeoLocation.getCurrent(this.onGPSSuccess, this.onGPSError);
            } else {
                var user = JSON.parse(localStorage.getItem("CurrentUser"));
                HomeCtrl.loadHomeData({ userid: user.id, latitude: '{0}'.format(crrnLoc.latitude), longitude: '{0}'.format(crrnLoc.longitude) });
            }
        } else {
            GeoLocation.getCurrent(this.onGPSSuccess, this.onGPSError);
        }

        //this.loadHomeData();
    },
    bannersTemp: null,
    loadHomeData: function (reqData) {
        try {
            //$.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
            if (HomeCtrl.bannersTemp == null) {
                var urlBanners = urlApi('get_advertisements.php');
                $.ajax({
                    url: urlBanners,
                    type: 'GET'
                }).done(function (result) {
                    var data = JSON.parse(result);
                    HomeCtrl.bannersTemp = data;
                    HomeCtrl.processBanner(reqData);
                }).error(function () {
                    SendAlert("The internet connection appears to be offline.");
                    $.mobile.loading('hide', { textVisible: false });
                });
            } else {
                //HomeCtrl.processBanner(reqData, true);
                HomeCtrl.loadDeferred.resolve();
                HomeCtrl.partialLoad();
            }
        } catch (ex) {
            SendAlert("Ops! " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    processBanner: function (reqData, opt) {
        opt = opt || false;
        var hgt = $(".banner").height();
        var wdt = $(".banner").width();
        var data = HomeCtrl.bannersTemp;
        var strUrl = urlApi('get_homepage_coupons.php?data=' + JSON.stringify(reqData));
        console.log(strUrl);
        if (!opt) {
            $("#banners").html('');
            $.each(data.data, function (idx, itm) {
                $("#banners").append($("<img alt='' class='imgLazy' />").attr("src", itm.banner_image).css("height", hgt + 'px').css("width", wdt + 'px').on("click", function () {
                    openWebBrowser(itm.hyperlink);
                }));
            });
        }
        //after banners loaded, call to load coupons
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data2 = JSON.parse(result);
            //if (data2.whatshot.length == 0 || data2.popular_data.length == 0) {
            //    HomeCtrl.loadHomeData({});
            //} else
            HomeCtrl.processData(data2, false);
        }).error(function () {
            SendAlert("Failed to load data.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    onGPSSuccess: function () {
        //SendAlert("GPS OK");
        //{"id":"139","name":"Jason Rappaport ","email":"sub@jasonrappaport.com"}

        var user = JSON.parse(localStorage.getItem("CurrentUser"));
        var crrnLoc = JSON.parse(localStorage.getItem("CurrentLocation"));
        if (crrnLoc) {
            localStorage.setItem("CurrentLocation", JSON.stringify($.extend(crrnLoc, { "latitude": GeoLocation.latitude, "longitude": GeoLocation.longitude })));
        } else {
            localStorage.setItem("CurrentLocation", JSON.stringify({ "latitude": GeoLocation.latitude, "longitude": GeoLocation.longitude }));
        }

        console.log("GPS: " + localStorage.getItem("CurrentLocation"));

        HomeCtrl.loadNearData({ userid: user.id, latitude: GeoLocation.latitude, longitude: GeoLocation.longitude });
    },
    onGPSError: function () {
        //SendAlert("GPS Error");
        //HomeCtrl.loadHomeData({});
    },
    loadNearData: function (reqData) {
        try {
            var strUrl = urlApi('get_homepage_coupons.php?data=' + JSON.stringify(reqData));
            $.ajax({
                url: strUrl,
                type: 'GET'
            }).done(function (result) {
                var data2 = JSON.parse(result);
                HomeCtrl.processData(data2, true);
            }).error(function () {
                SendAlert("Failed to load data.");
                $.mobile.loading('hide', { textVisible: false });
            });
        } catch (ex) {
            SendAlert("Ops! " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    currentHomedata: {},
    couponsCategorydata: [],
    processData: function (data2, onlyNear) {
        onlyNear = onlyNear || false;
        try {
            this.currentHomedata = data2;
            $.Mustache.load('js/views/Home.html').fail(function () {
                SendAlert('Failed to load templates');
            }).done(function () {

                var hotOut = $("#ulHotPrd"), popOut = $("#ulPopPrd"), nearOut = $("#ulNearPrd");
				console.log("nearme1");
                if (!onlyNear) {
                    //Hot Products section
                    hotOut.html('');
                    if (data2.whatshot.length > 0) {
                        $.each(data2.whatshot, function (idx, itm) {
                            hotOut.append($.Mustache.render('coupon-aux', itm));
                        });
                        hotOut.append($.Mustache.render('see-all-item', { name: 'Hot' }));
                        hotOut.show();
                        $("#lblNoHotCoupon").hide();
                    } else {
                        hotOut.hide();
                        $("#lblNoHotCoupon").show();
                    }
                    //Popular Products section
                    popOut.html('');
                    if (data2.popular_data.length > 0) {
                        $.each(data2.popular_data, function (idx, itm) {
                            popOut.append($.Mustache.render('coupon-aux', itm));
                        });
                        popOut.append($.Mustache.render('see-all-item', { name: 'Popular' }));
                        popOut.show();
                        $("#lblNoPopCoupon").hide();
                    } else {
                        popOut.hide();
                        $("#lblNoPopCoupon").show();
                    }

                }
                //Near Products section
                console.log(data2.nearme_data.length);
                if (data2.nearme_data.length > 0) {
                    nearOut.html('');
                    $.each(data2.nearme_data, function (idx, itm) {
                        nearOut.append($.Mustache.render('coupon-aux', itm));
                    });

                    nearOut.append($.Mustache.render('see-all-item', { name: 'Near' }));
                    nearOut.show();
                    $("#lblNoNearCoupon").hide();
                } else {
                    nearOut.hide();
                    //$("#divNearPrd .SwipeWrapper").append('<h3>No coupons currently found near you.</h3>');
                    $("#lblNoNearCoupon").show();
                }
                $.mobile.loading('hide', { textVisible: false });
                HomeCtrl.loadDeferred.resolve();
				
				
				//adjust code to remove loading image on the near me coupon: 2014/12/16
				HomeCtrl.adjustHomeCoupons();
                $("#lblHomeLoading").data("visible", false).hide();
				///////////////////////
				
                //$('.imgLazy').batchImageLoad({
                //    loadingCompleteCallback: function () { HomeCtrl.loadDeferred.resolve(); },
                //    imageLoadedCallback: function () { }
                //});

            });
        } catch (ex) {
            SendAlert("Exception: " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    backActionAllCoupons: function () { },
    isProcessingAllData: false,
    seeAllCoupons: function (start, reverse, couponDetailBackAction) {
        if (HomeCtrl.isProcessingAllData) return;
        HomeCtrl.isProcessingAllData = true;
        reverse = reverse || false;
        //SendAlert("allcoupons");
        $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
            HomeCtrl.loadAllCouponsData(start, couponDetailBackAction);
            $("#allcouponstabs ul > li > a").each(function () {
                $(this).removeClass("ui-btn-active");
            });
            switch (start) {
                case 'Hot':
                    //$("#btnTabWHAll").trigger("click").parent().trigger("focus");
                    $("#btnTabWHAll").addClass("ui-btn-active");
                    break;
                case 'Popular':
                    $("#btnTabPopAll").addClass("ui-btn-active");
                    break;
                case 'Near':
                    $("#btnTabNearAll").addClass("ui-btn-active");
                    break;
            }
            //bindGestures();
        });
        $(":mobile-pagecontainer").pagecontainer("change", "allcoupons.html", { transition: "slide", showLoadMsg: true, reverse: reverse });
    },
    loadAllCouponsData: function (start, couponDetailBackAction) {
        var data = [];
        CouponCtrl.backAction = couponDetailBackAction || function () { HomeCtrl.seeAllCoupons(start, true); };
        switch (start) {
            case 'Hot':
                data = HomeCtrl.currentHomedata.whatshot || [];
                break;
            case 'Popular':
                data = HomeCtrl.currentHomedata.popular_data || [];
                break;
            case 'Near':
                data = HomeCtrl.currentHomedata.nearme_data || [];
                break;
            case 'Category':
                data = HomeCtrl.couponsCategorydata || [];
                break;
        }
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });

        $.Mustache.load('js/views/Home.html').fail(function () {
            SendAlert('Failed to load templates');
        }).done(function () {
            //$.Mustache.render('coupon-simple', itm)
            var $allcoupons = $("#allCouponsContainer");
            $allcoupons.html("");
            var count = 0;
            var row = null;
            $.each(data, function (idx, itm) {
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
                if (count <= 2 && idx == data.length - 1)
                    $allcoupons.append(row);
            });
            if (data.length == 0 && start == 'Category') {
                $("#allCouponsContainer").html("<div class='nodata'>Sorry, there are no coupons available. New coupons are being added, please check back soon.</div>");
            }
            if (data.length == 0 && start == 'Near') {
                $("#allCouponsContainer").html("<div class='nodata'>There are no coupons available near you. Try again later.</div>");
            } else if (data.length == 0 && (start == 'Hot' || start == 'Popular')) {
                $("#allCouponsContainer").html("<div class='nodata'>There are no coupons available. Try again later.</div>");
            }
            $.mobile.loading('hide', { textVisible: false });
            HomeCtrl.isProcessingAllData = false;
        });
    },
    openCategories: function (reverse) {
        reverse = reverse || false;

        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({
            url: urlApi('get_categories.php'),
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            $(":mobile-pagecontainer").one("pagecontainerbeforeload", function (event, ui) {

            });
            $(":mobile-pagecontainer").one("pagecontainerchange", function (event, ui) {
                var listCat = $("#lstCategories");
                listCat.html("<li data-icon='false' data-theme='c'><a data-theme='c' href=\"javascript:navTo('#index-page', true, 'flip');\">All</a></li>");
                $.each(data, function (idx, itm) {
                    listCat.append("<li data-icon='false' data-theme='c'><a href='#' data-theme='c' onclick=\"HomeCtrl.openCategory('" + itm.id + "' , '" + itm.name + "', false, function(){HomeCtrl.openCategories(true);} );\">" + itm.name + "</a></li>");
                });
                listCat.listview().listview("refresh");
            });
            $(":mobile-pagecontainer").pagecontainer("change", "categories.html", { transition: reverse ? "slide" : "flip", showLoadMsg: true, reverse: reverse });
        }).error(function () {
            SendAlert("Failed to load categories.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    openCategory: function (catId, catName, reverse, allCouponCatBackAction) {
        reverse = reverse || false;
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        var urlSrv = urlApi('get_category_coupons.php?data=' + JSON.stringify({ "category_id": catId }));
        console.log(urlSrv);
        $.ajax({
            url: urlSrv,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.data) {
                HomeCtrl.couponsCategorydata = data.data;
            }
            else {
                HomeCtrl.couponsCategorydata = [];
            }

            $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function (event, ui) {
                $("#allcouponstabs").hide();
                $(".search_icon").hide();
                catName = catName.length > 10 ? catName.substring(0, 7) + '..' : catName;
                $(".headerTitle").html(catName);
                //$(".back").addClass("nobind").attr("href", "javascript:HomeCtrl.openCategories(true);");
                HomeCtrl.backActionAllCoupons = allCouponCatBackAction;
            });
            HomeCtrl.seeAllCoupons('Category', reverse, function () {
                HomeCtrl.openCategory(catId, catName, true, allCouponCatBackAction);
            });
        }).error(function () {
            SendAlert("Failed to load categories.");
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    adjustHomeCoupons: function () {
        this.myScrolls = [];
        //Banners
        var hgt = $(".banner").height();
        var wdt = $(".banner").width();
        console.log(hgt + ' - ' + wdt);
        $("#banners img").css("height", hgt + 'px').css("width", wdt + 'px');
        $('#banners').cycle("destroy").cycle({
            fx: 'scrollLeft',
            speed: 500,
            timeout: 3800
        });

        //Hot Products section
        var widthContainer = $("#divHotPrd").width() / 3;
        $("#divHotPrd li").each(function () {
            $(this).width(widthContainer - 2);
        });
        $("#divHotPrd .SwipeScroller").width(((HomeCtrl.currentHomedata.whatshot.length + 1) * widthContainer) - ((HomeCtrl.currentHomedata.whatshot.length + 1) * 2));
        setTimeout(function () {
        HomeCtrl.myScrolls.push(new IScroll('#divHotPrd .SwipeWrapper', { eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: false }));
        }, 400);


        //Popular Products section
        $("#divPopPrd li").each(function () {
            $(this).width(widthContainer - 2);
        });
        $("#divPopPrd .SwipeScroller").width(((HomeCtrl.currentHomedata.popular_data.length + 1) * widthContainer) - ((HomeCtrl.currentHomedata.popular_data.length + 1) * 2));
        setTimeout(function () {
        HomeCtrl.myScrolls.push(new IScroll('#divPopPrd .SwipeWrapper', { eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: false }));
        }, 400);
        //Near Products section
        if (HomeCtrl.currentHomedata.nearme_data.length > 0) {
            $("#divNearPrd li").each(function () {
                $(this).width(widthContainer - 2);
            });
            $("#divNearPrd .SwipeScroller").width(((HomeCtrl.currentHomedata.nearme_data.length + 1) * widthContainer) - ((HomeCtrl.currentHomedata.nearme_data.length + 1) * 2));
            setTimeout(function () {
            HomeCtrl.myScrolls.push(new IScroll('#divNearPrd .SwipeWrapper', { eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: false }));
            }, 400);
        }

        setTimeout(function () {
            $(".small_box img").unveil(0, function () {
                try {
                    $(this).load(function () {
                        $(this).closest("div.bgloading").removeClass("bgloading");
                        console.log(this.src);
                    }).error(function () {
                        $(this).closest("div.bgloading").removeClass("bgloading");
                        console.log("Error evnt: " + $(this).attr("src"));
                        $(this).attr("src", 'images/logo_default_image2.jpg')
                    });
                } catch (ex) {
                    console.log("Error: " + $(this).attr("src"));
                }
            });
        }, 500);
        //$(".iscroll-wrapper", this).bind({
        //    iscroll_onpulldown: function () { alert("pulled"); },
        //    iscroll_onpullup: function () { alert("asdasdadasfdsftrikuy"); }
        //});
    },
    partialLoad: function () {
        try {
            $("#lblHomeLoading").show();
            var crrnLoc = JSON.parse(localStorage.getItem("CurrentLocation"));
            var user = JSON.parse(localStorage.getItem("CurrentUser"));
            var reqData = { userid: user.id, latitude: '{0}'.format(crrnLoc.latitude || ''), longitude: '{0}'.format(crrnLoc.longitude || '') };
            var strUrl = urlApi('get_homepage_coupons.php?data=' + JSON.stringify(reqData));
            console.log(strUrl);
            $.ajax({
                url: strUrl,
                type: 'GET'
            }).done(function (result) {
                //console.log(result);
                var data = JSON.parse(result);
                HomeCtrl.currentHomedata = data;
                $.Mustache.load('js/views/Home.html').fail(function () {
                    SendAlert('Failed to load templates');
                }).done(function () {
                    myScroll.minScrollY = 0;
                    myScroll.refresh();
                    var hotOut = $("#ulHotPrd"), popOut = $("#ulPopPrd"), nearOut = $("#ulNearPrd");
					console.log("nearme2");
                    //Hot Products section
                    hotOut.html('');
                    if (data.whatshot.length > 0) {
                        $.each(data.whatshot, function (idx, itm) {
                            hotOut.append($.Mustache.render('coupon-aux', itm));
                        });
                        hotOut.append($.Mustache.render('see-all-item', { name: 'Hot' }));
                        hotOut.show();
                        $("#lblNoHotCoupon").hide();
                    } else {
                        hotOut.hide();
                        $("#lblNoHotCoupon").show();
                    }
                    //Popular Products section
                    popOut.html('');
                    if (data.popular_data.length > 0) {
                        $.each(data.popular_data, function (idx, itm) {
                            popOut.append($.Mustache.render('coupon-aux', itm));
                        });
                        popOut.append($.Mustache.render('see-all-item', { name: 'Popular' }));
                        popOut.show();
                        $("#lblNoPopCoupon").hide();
                    } else {
                        popOut.hide();
                        $("#lblNoPopCoupon").show();
                    }

                    //Near Products section
                    if (data.nearme_data.length > 0) {
                        nearOut.html('');
                        $.each(data.nearme_data, function (idx, itm) {
                            nearOut.append($.Mustache.render('coupon-aux', itm));
                        });

                        nearOut.append($.Mustache.render('see-all-item', { name: 'Near' }));
                        nearOut.show();
                        $("#lblNoNearCoupon").hide();
                    } else {
                        nearOut.hide();
                        //$("#divNearPrd .SwipeWrapper").append('<h3>No coupons currently found near you.</h3>');
                        $("#lblNoNearCoupon").show();
                    }

                    HomeCtrl.adjustHomeCoupons();
                    $("#lblHomeLoading").data("visible", false).hide();
                });
            }).error(function () {
                SendAlert("Failed to load data.");
                $("#lblHomeLoading").hide();
                $.mobile.loading('hide', { textVisible: false });
            });
        }
        catch (ex) {
            console.log(ex);
        }
    }
};



var myScroll,
	pullDownEl, pullDownOffset,
	pullUpEl, pullUpOffset,
	generatedCount = 0;

function pullDownAction() {
	//alert("pullDownAction");//alex
    //$("#lblHomeLoading").data("visible", false).hide();
    // $("#lblHomeIntLoading").show();
    HomeCtrl.partialLoad();
}

function pullUpAction() {
    alert("pull up");
}

function pullDownLoaded() {
    if (myScroll) return;
    //pullDownEl = document.getElementById('pullDown');
    //pullDownOffset = pullDownEl.offsetHeight;
    //pullUpEl = document.getElementById('pullUp');
    //pullUpOffset = pullUpEl.offsetHeight;

    myScroll = new iScroll('wrapper', {
        useTransition: true,
        topOffset: 0,
        onRefresh: function () {
            $("#lblHomeLoading").data("visible", false).hide();
            $("#lblHomeIntLoading").hide();
            //if (pullDownEl.className.match('loading')) {
            //    pullDownEl.className = '';
            //    pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Pull down to refresh...';
            //} else if (pullUpEl.className.match('loading')) {
            //    pullUpEl.className = '';
            //    pullUpEl.querySelector('.pullUpLabel').innerHTML = 'Pull up to load more...';
            //}
        },
        onScrollMove: function () {
            //console.log(this.y);
            if (this.y > 25 && $("#lblHomeLoading").data("visible") == false) {
                //pullDownEl.className = 'flip';
                //pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Release to refresh...';
                $("#lblHomeLoading").data("visible", true).show();
                this.minScrollY = 0;
            }
            //else if (this.y < 5 && pullDownEl.className.match('flip')) {
            //    pullDownEl.className = '';
            //    pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Pull down to refresh...';
            //    this.minScrollY = -pullDownOffset;
            //} else if (this.y < (this.maxScrollY - 5) && !pullUpEl.className.match('flip')) {
            //    pullUpEl.className = 'flip';
            //    pullUpEl.querySelector('.pullUpLabel').innerHTML = 'Release to refresh...';
            //    this.maxScrollY = this.maxScrollY;
            //} else if (this.y > (this.maxScrollY + 5) && pullUpEl.className.match('flip')) {
            //    pullUpEl.className = '';
            //    pullUpEl.querySelector('.pullUpLabel').innerHTML = 'Pull up to load more...';
            //    this.maxScrollY = pullUpOffset;
            //}
        },
        onScrollEnd: function () {
            //$("#lblHomeLoading").hide();
            if ($("#lblHomeLoading").data("visible"))
                pullDownAction();
            //if (pullDownEl.className.match('flip')) {
            //    pullDownEl.className = 'loading';
            //    pullDownEl.querySelector('.pullDownLabel').innerHTML = 'Loading...';
            //    pullDownAction();	// Execute custom function (ajax call?)
            //} else if (pullUpEl.className.match('flip')) {
            //    pullUpEl.className = 'loading';
            //    pullUpEl.querySelector('.pullUpLabel').innerHTML = 'Loading...';
            //    pullUpAction();	// Execute custom function (ajax call?)
            //}
        }
    });

    setTimeout(function () { document.getElementById('wrapper').style.left = '0'; }, 200);
}