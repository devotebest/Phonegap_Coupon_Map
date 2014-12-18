var iframeCtrl = {
    title: "",
    src: "",
    backAction: function () {
    },
    open: function (predefinedUrl) {
        predefinedUrl = predefinedUrl || "";
        switch (predefinedUrl) {
            case 'FAQ':
                iframeCtrl.title = "FAQ";
                iframeCtrl.src = "http://www.couwallabi.com/faq/";
                iframeCtrl.backAction = function () {
                    ProfileCtrl.open(true);
                    $("#iframe-page-iframe").attr("src", "about:blank");
                };
                break;
            case 'TAC':
                iframeCtrl.title = "Terms and Conditions";
                iframeCtrl.src = "TermsAndConditions.html";
                iframeCtrl.backAction = function () {
                    ProfileCtrl.open(true);
                    $("#iframe-page-iframe").attr("src", "about:blank");
                };
                break;
            case 'PP':
                iframeCtrl.title = "Privacy Policy";
                iframeCtrl.src = urlApi("privacy_policy/privacy_policy.html");
                iframeCtrl.backAction = function () {
                    ProfileCtrl.open(true);
                    $("#iframe-page-iframe").attr("src", "about:blank");
                };
                break;
        }

        $("#iframe-page-title").html(iframeCtrl.title);
        $("#iframe-page-iframe").attr("src", iframeCtrl.src);
        $(":mobile-pagecontainer").pagecontainer("change", "#iframe-page", { transition: "slide", showLoadMsg: true, reverse: false });
    }
}