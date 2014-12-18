var WalletCtrl = {
    open: function (reverse) {
        reverse = reverse || false;
        WalletDB.init();
        $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function () {
            WalletDB.loadSavedCards();
            $.mobile.loading('hide', { textVisible: false });
        });
        $(":mobile-pagecontainer").pagecontainer("change", "wallet.html", { transition: "slide", showLoadMsg: true, reverse: reverse });
    },
    cardBackAction: function () {
        WalletCtrl.open(true);
    },
    openNewCard: function () {
        $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function () {
            $("#btnNewCardSave").one("click", function () {
                WalletDB.saveCard();
            });
        });
        $(":mobile-pagecontainer").pagecontainer("change", "wallet.new_card.html", { transition: "slide", showLoadMsg: true });
    },
    takePicture: function (imgTag) {
        $.mobile.loading('show', { textVisible: true, text: 'Starting camera..', theme: 'c' });
        navigator.camera.getPicture(onSuccess, onFail, {
            quality: 50,
            targetWidth: 200,
            targetHeight: 200,
            destinationType: Camera.DestinationType.DATA_URL
        });

        function onSuccess(imageData) {
            var image = document.getElementById(imgTag);
            image.src = "data:image/jpeg;base64," + imageData;
            $.mobile.loading('hide', { textVisible: false });
        }

        function onFail(message) {
            SendAlert('Failed because: ' + message);
            $.mobile.loading('hide', { textVisible: false });
        }
    },
    scanCode: function () {
        $.mobile.loading('show', { textVisible: true, text: 'Starting camera..', theme: 'c' });
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                try {
                    $("#imgBarCodeScanned").barcode(result.text, "ean13", { showHRI: false });
                    $("#txtManuallyBarCode").val(result.text);
                    $.mobile.loading('hide', { textVisible: false });
                } catch (ex) {
                    SendAlert("Error on scan barcode.");
                    $.mobile.loading('hide', { textVisible: false });
                }
            },
            function (error) {
                SendAlert("Scanning failed: " + error);
                $.mobile.loading('hide', { textVisible: false });
            });
    },
    crrnCard: null,
    cardDetail: function (id) {
        WalletDB.getCardDetail(id);
    },
    editCard: function () {
        $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function () {
            $("#txtLoyaltyCardName").val(WalletCtrl.crrnCard.name);
            $("#txtManuallyBarCode").val(WalletCtrl.crrnCard.barcode);
            $("#imgFrontCard").attr("src", WalletCtrl.crrnCard.img_front);
            $("#imgBackCard").attr("src", WalletCtrl.crrnCard.img_back);
            $("#imgBarCodeScanned").barcode(WalletCtrl.crrnCard.barcode, "ean13", { showHRI: false });

            $("#btnNewCardSave").one("click", function () {
                WalletDB.updateCard();
            });
        });
        $(":mobile-pagecontainer").pagecontainer("change", "wallet.new_card.html", { transition: "slide", showLoadMsg: true });
    },
    EnterManuallyBTN: function () {
        $("#txtManuallyBarCode").prop("readonly", false).trigger("focus");
        $("#txtManuallyBarCode").off("blur").on("blur", function () {
            $(this).prop("readonly", true);
        });
    },
    bindListAction: function (ListId) {
        $(document).off("swipeleft swiperight").on("swipeleft swiperight", ListId + " li", function (event) {
            if (event.type === "swipeleft") {
                $(this).find(".deleteListItem").html("Delete").removeClass("ui-btn-icon-notext").show();
            }
            else {
                $(this).find(".deleteListItem").hide();
            }
            WalletCtrl.bindListAction(ListId);
        });
        $.mobile.loading('hide', { textVisible: false });
    },
};

var WalletDB = {
    db: {},
    init: function () {
        this.db = window.openDatabase("WalletDB", "1.0", "WalletDB", 5000000);
        function populateDB(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS MyCards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, barcode TEXT, img_front TEXT, img_back TEXT)');
        }
        this.db.transaction(populateDB, this.errorCB, this.successCB);
    },
    errorCB: function (err) {
        console.log("Error processing SQL: " + err.code);
        console.log(JSON.stringify(err));
        $.mobile.loading('hide', { textVisible: false });
    },
    successCB: function () {
        console.log("SQL Executed correctly.");
        $.mobile.loading('hide', { textVisible: false });
    },
    loadSavedCards: function () {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        console.log("call loadSavedCards..");
        this.db.transaction(
		function (t) {
		    console.log("executing transaction..");
		    t.executeSql('SELECT id,name,barcode,img_front FROM MyCards', [],
				function (tx, results) {
				    var len = results.rows.length;
				    console.log("cmd executed..");
				    console.log("Returned rows = " + len);

				    if (len == 0) {
				        $("#divNoCards").show();
				        $("#divListCards").hide();
				        $("#btnWalletAddNew").hide();
				        return;
				    } else {
				        $("#divNoCards").hide();
				        $("#divListCards").show();
				        $("#btnWalletAddNew").show();
				    }

				    var lst = [];
				    for (var i = 0; i < len; i++) {
				        lst.push(results.rows.item(i));
				    }

				    try {
				        $.Mustache.load('js/views/Wallet.html').fail(function () {
				            SendAlert('Failed to load templates');
				        }).done(function () {
				            $("#divListCards").html($.Mustache.render('wallet-card', { list: lst }));
				            $("#lstWalletCards").listview().listview("refresh");
				            WalletCtrl.bindListAction("#lstWalletCards");
				            $.mobile.loading('hide', { textVisible: false });
				        });
				    } catch (ex) {
				        SendAlert("Exception: " + ex.message);
				        $.mobile.loading('hide', { textVisible: false });
				    }

				    $.mobile.loading('hide', { textVisible: false });
				}, WalletDB.errorCB);
		}, this.errorCB);
    },
    saveCard: function () {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        this.db.transaction(
            function (tx) {
                var sql = "INSERT INTO MyCards VALUES(NULL,'{0}','{1}','{2}','{3}');".
                            format(
                                $("#txtLoyaltyCardName").val(),
                                $("#txtManuallyBarCode").val(),
                                $("#imgFrontCard").attr("src"),
                                $("#imgBackCard").attr("src")
                                );
                tx.executeSql(sql)
            },
            this.errorCB,
            function () {
                $.mobile.loading('hide', { textVisible: false });
                WalletCtrl.open(true);
            });
    },
    updateCard: function () {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        this.db.transaction(
            function (tx) {
                var sql = "UPDATE MyCards SET name='{0}',barcode='{1}',img_front='{2}',img_back='{3}' WHERE id={4};".
                            format(
                                $("#txtLoyaltyCardName").val(),
                                $("#txtManuallyBarCode").val(),
                                $("#imgFrontCard").attr("src"),
                                $("#imgBackCard").attr("src"),
                                WalletCtrl.crrnCard.id
                                );
                tx.executeSql(sql)
            },
            this.errorCB,
            function () {
                $.mobile.loading('hide', { textVisible: false });
                WalletCtrl.open(true);
            });
    },
    getCardDetail: function (id) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        console.log("call load card detail..");
        this.db.transaction(
		function (t) {
		    console.log("executing transaction..");
		    t.executeSql('SELECT * FROM MyCards WHERE id=' + id, [],
				function (tx, results) {
				    var len = results.rows.length;
				    console.log("cmd executed..");
				    console.log("Returned rows = " + len);
				    var itm = results.rows.item(0);
				    WalletCtrl.crrnCard = itm;
				    $(":mobile-pagecontainer").one("pagecontainerbeforeshow", function () {
				        $("#lblCardDetName").html(itm.name);
				        $("#lblCardDetBarcodeText").html(itm.barcode);
				        $("#imgCardDetFront").attr("src", itm.img_front);
				        $("#imgCardDetBack").attr("src", itm.img_back);
				        $("#divCardDetBarcode").barcode(itm.barcode, "ean13", { showHRI: false });

				    });
				    $(":mobile-pagecontainer").pagecontainer("change", "wallet.card_detail.html", { transition: "slide", showLoadMsg: true });


				}, WalletDB.errorCB);
		}, this.errorCB);
    },
    deleteCard: function (id) {
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        console.log("call delete card detail..");
        this.db.transaction(
		function (t) {
		    console.log("executing transaction..");
		    t.executeSql('DELETE FROM MyCards WHERE id=' + id, [],
				function (tx, results) {
				    WalletDB.loadSavedCards();
				}, WalletDB.errorCB);
		}, this.errorCB);
    }
};