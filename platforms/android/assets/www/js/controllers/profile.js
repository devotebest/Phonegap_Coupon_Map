var ProfileCtrl = {
    profileData: {},
    init: function () {
        $(":mobile-pagecontainer").pagecontainer("load", "profile.html", { role: 'page', idPage: 'profile-page' });
    },
    open: function (reverse) {
        reverse = reverse || false;
        $(":mobile-pagecontainer").pagecontainer({
            change: function (event, ui) {

            }
        });

        $(":mobile-pagecontainer").pagecontainer("change", "profile.html", { transition: "slide", showLoadMsg: true, reverse: reverse });
        ProfileCtrl.loadData();
    },
    loadData: function () {
        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
        var reqData = { "userid": crrnUsr.id };
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({ url: urlApi('get_myprofile_data.php?data=' + JSON.stringify(reqData)), type: 'GET' }).done(function (result) {

            var conv = JSON.parse(result);

            var profileData = conv.response ? {} : conv.data[0];
            $('#lid').val(profileData.Email);
            $.each(profileData, function (key, value) {
                var element = document.getElementById(key);
                if (element) {

                    $(element).val(value);
                    if ($(element).prop("tagName").toLowerCase() === "select") {
                        $(element).selectmenu('refresh');
                    }
                }
            });
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    save: function () {
        var crrnUsr = JSON.parse(localStorage.getItem("CurrentUser"));
        var data = { "userid": crrnUsr.id };
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $('.profile-field').each(function () {

            data[$(this).attr('id')] = $(this).val();

        });
        $.ajax({ url: urlApi('update_profile.php?data=' + JSON.stringify(data)), type: 'GET' }).done(function (result) {
            var res = JSON.parse(result);
            if (res.response) {
                if (res.response == "success") {
                    SendAlert(res.message);
                    //openCloseMenu(panelId);
                    $.mobile.loading('hide', { textVisible: false });
                    return;
                }
                else {
                    SendAlert("Error on save profile data");
                }
            }
            else {
                SendAlert("Error on save profile data");
            }
            $.mobile.loading('hide', { textVisible: false });
        });
    },
    openMenu: function (panelId) {

        openCloseMenu(panelId);

        //ProfileCtrl.save(panelId);

    },
    logout: function () {
        localStorage.removeItem("CurrentUser");
        localStorage.removeItem("CurrentLocation");
        $(":mobile-pagecontainer").pagecontainer("change", "#login-page", { transition: "flip", showLoadMsg: true, reverse: true });

    }
};