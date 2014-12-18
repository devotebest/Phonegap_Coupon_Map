var MySearch = {
    init: function () {
        $(":mobile-pagecontainer").pagecontainer("load", "search.html", { role: 'page' });
        //this.loadEvents();
    },
    open: function (reverse) {
        reverse = reverse || false;
        $(":mobile-pagecontainer").pagecontainer({
            change: function (event, ui) {
                $("#txtSearch").attr("type", "search");
                MySearch.loadEvents();
            }
        });
        $(":mobile-pagecontainer").pagecontainer("change", "search.html", { transition: "slide", showLoadMsg: true, reverse: reverse });
    },
    loadEvents: function () {
        $("#txtSearch").on("keypress", function (event) {
            if (event.keyCode == '13') {
                try {
                    //http://api.couwallabi.com/v2/search_manufacturer_coupons.php?data=%7b%22search_text%22:%22buca%22%7d
                    var reqData = { "search_text": $(this).val() };
                    var strUrl = urlApi('search_manufacturer_coupons.php?data=' + JSON.stringify(reqData));
                    console.log(strUrl);
                    $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
                    $.ajax({
                        url: strUrl,
                        type: 'GET'
                    }).done(function (result) {
                        var data = JSON.parse(result);
                        MySearch.processData(data);
                    }).error(function () {
                        SendAlert("Failed to load data.");
                        $.mobile.loading('hide', { textVisible: false });
                    });
                } catch (ex) {
                    SendAlert("Ops! " + ex.message);
                    $.mobile.loading('hide', { textVisible: false });
                }
            }
        });
    },
    processData: function (data) {
        try {
            $.Mustache.load('js/views/Search.html').fail(function () {
                SendAlert('Failed to load templates');
            }).done(function () {
                CouponCtrl.backAction = function () {
                    MySearch.open(true);
                };
                $("#listContent").html($.Mustache.render('search-result', { list: data.data }));
                $("#lstResultSearch").listview().listview("refresh");
                $("#mainSearch").addClass("done");
                $.mobile.loading('hide', { textVisible: false });
            });
        } catch (ex) {
            SendAlert("Exception: " + ex.message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    returnBack: function () {
        $(":mobile-pagecontainer").pagecontainer("change", "#search-page", { transition: "slide", showLoadMsg: true, reverse: true });
    },
    goBack: function () {
        $(":mobile-pagecontainer").pagecontainer("change", "#index-page", { transition: "slide", showLoadMsg: true, reverse: true });
    }
};