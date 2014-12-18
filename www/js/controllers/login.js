$(document).ready(function () {
    //$("#cmbGenre").selectmenu("destroy");
    $("#cmbGenre").selectmenu("refresh", true);
    adjustSelect();
    $("#txtEmail").focus(function () {
        $(this).parent().css("box-shadow", "none");
        var ctrl = $(this);
        ctrl.closest('table').addClass("ui-focus");
        $(this).css("box-shadow", "none");
    });

    $("#txtEmailConfirm").focus(function () {
        //var parent = $(this).parentsUntil($("table.tbl-input").parent(), ".tbl-input");
        //parent.addClass("ui-focus");
        $(this).parent().css("box-shadow", "none");
        $(this).closest('table').addClass("ui-focus");
        $(this).css("box-shadow", "none");
    });
    $("#txtEmailConfirm").blur(function () {
        var parent = $(this).parentsUntil($("table.tbl-input").parent(), ".tbl-input");
        parent.removeClass("ui-focus");
    });

    $("table.tbl-input").click(function () {
        var input = $(this).next().children();
        console.log(input);
        input.trigger("focus");
    });

    $(".div-select").click(function () {
        $("#popupGender").popup("open", {});
    });


    var height = $("#inputs").outerHeight(true);
    $("#inputs").css("height", height + 'px');
    $("#inputs").css("max-height", height + 'px');
});

function adjustSelect() {
    var total = $(window).width();
    var arrow = $(".div-select>img").width();
    var icon = $(".div-select .img-container").width();
    //$("#cmbGenre-button").width((total * 0.9) - (arrow + icon));
    $("#popupGender").width(total * 0.8);
}

function changeAction(ctrl) {
    var height1 = $("#tbl_input_EmailConf").outerHeight();
    var height2 = $("#div_select_gender").outerHeight();

    if ($(ctrl).data("action") == "login") {
        $(ctrl).attr("src", "images/login_link_signup.png");
        $(ctrl).data("action", "signup");
        $("#btnAction").attr("src", "images/login_btn_login.png");
        $("#btnAction").data("action", "login");
        $("#tbl_input_EmailConf").transition({
            opacity: 0, scale: 0.3,
            duration: 200,
            easing: 'in',
        });
        setTimeout(function () {
            $("#div_select_gender").transition({
                opacity: 0, scale: 0.3,
                duration: 300,
                easing: 'in',
            });
            $('#tbl_input_Email').transition({
                y: (height1 + height2 + 10) + 'px', duration: 600,
            });
        }, 100);
    } else {
        $(ctrl).attr("src", "images/login_link_login.png");
        $(ctrl).data("action", "login");
        $("#btnAction").attr("src", "images/login_btn_signup.png");
        $("#btnAction").data("action", "signup");
        $("#div_select_gender").transition({
            opacity: 1, scale: 1,
            duration: 200,
            easing: 'in',
        });
        setTimeout(function () {
            $("#tbl_input_EmailConf").transition({
                opacity: 1, scale: 1,
                duration: 300,
                easing: 'in',
            });
            $('#tbl_input_Email').transition({
                y: '0px', duration: 600,
            });
        }, 100);
    }
}

function selectGender(val) {
    $("#lblSelGender").html(val).css("color", "#000");
    $("#popupGender").popup("close");
}

function doAction(btn) {
    var btnAct = $(btn).data("action");
    if (btnAct == "login") {
        LogIn();
    } else {
        SignUp();
    }
}

//###### FACEBOOK API ###########
function loginFB() {
    $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
    openFB.login(
        function (response) {
            if (response.status === 'connected') {
                //SendAlert('Facebook login succeeded, got access token: ' + response.authResponse.token);
                openFB.api({
                    path: '/me',
                    success: function (dataFB) {
                        //document.getElementById("userName").innerHTML = data.name;
                        //document.getElementById("userPic").src = 'http://graph.facebook.com/' + data.id + '/picture?type=small';
                        //http://api.couwallabi.com/v2/fb_login?data={"loginid":"sub@jasonrappaport.com","fb_id":"10203636278487566","gender":"male"}
                        //{"response":"Success","message":"Authentication Success","data":{"id":"139","name":"Jason Rappaport ","email":"sub@jasonrappaport.com"}}
                        var reqData = { "loginid": dataFB.email, "fb_id": dataFB.id, "gender": dataFB.gender };
                        try {
                            this.myScrolls = [];
                            var strUrl = urlApi('fb_login?data=' + JSON.stringify(reqData));
                            console.log(strUrl);
                            $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
                            $.ajax({
                                url: strUrl,
                                type: 'GET'
                            }).done(function (result) {
                                var data = JSON.parse(result);
                                if (data.response == "Success") {
                                    localStorage.setItem("CurrentUser", JSON.stringify(data.data));
                                    localStorage.setItem("CurrentLocation", JSON.stringify({ "type": "loc", "value": "" }));
                                    HomeCtrl.open(false, 'flip');
                                } else {
                                    SendAlert(data.message);
                                }
                                //$.mobile.loading('hide', { textVisible: false });
                            }).error(function () {
                                SendAlert("Failed to load data.");
                                $.mobile.loading('hide', { textVisible: false });
                            });
                        } catch (ex) {
                            SendAlert("Ops! " + ex.message);
                            $.mobile.loading('hide', { textVisible: false });
                        }
                    },
                    error: errorHandler
                });
            } else {
                SendAlert('Facebook login failed: ' + response.error);
                $.mobile.loading('hide', { textVisible: false });
            }
        },
        { scope: 'email,read_stream,publish_stream' }
    );
}

function errorHandler(error) {
    SendAlert("FB: " + error.message);
    $.mobile.loading('hide', { textVisible: false });
}


//########## Direct API SignUp ###########
function SignUp() {
    //var urlApi = "http://api.couwallabi.com/v2/signup.php?data="; //{"email":"julio@julio.com","password":"0000"}
    var email = $("#txtEmail").val();
    var emailConf = $("#txtEmailConfirm").val();
    if (email != emailConf) {
        SendAlert("The mail and confirm are not equals.");
        return;
    }
    var gender = $("#lblSelGender").text();
    if (gender == "Gender") {
        SendAlert("Please select a Gender.");
        return;
    }

    try {
        this.myScrolls = [];
        var strUrl = urlApi('signup.php?data=' + JSON.stringify({ "email": email, "password": "0000" }));
        console.log(strUrl);
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.response == "Success") {
                LogIn();
                //console.log(data);
                //localStorage.setItem("CurrentUser", JSON.stringify(data.data));
                //HomeCtrl.open();
                //$(":mobile-pagecontainer").pagecontainer("change", "#index-page", { transition: "slide", showLoadMsg: true });
            } else {
                SendAlert(data.message);
            }
            $.mobile.loading('hide', { textVisible: false });
        }).error(function () {
            SendAlert("Failed to load data.");
            $.mobile.loading('hide', { textVisible: false });
        });
    } catch (ex) {
        SendAlert("Ops! " + ex.message);
        $.mobile.loading('hide', { textVisible: false });
    }
}

function LogIn() {
    var email = $("#txtEmail").val();
    try {
        this.myScrolls = [];
        var strUrl = urlApi('signin.php?data=' + JSON.stringify({ "loginid": email, "password": "0000" }));
        console.log(strUrl);
        $.mobile.loading('show', { textVisible: true, text: 'Please wait...', theme: 'c' });
        $.ajax({
            url: strUrl,
            type: 'GET'
        }).done(function (result) {
            var data = JSON.parse(result);
            if (data.response == "Success") {
                localStorage.setItem("CurrentUser", JSON.stringify(data.data));
                localStorage.setItem("CurrentLocation", JSON.stringify({ "type": "loc", "value": "" }));
                HomeCtrl.open(false, 'flip');
            } else {
                SendAlert(data.message);
            }
            $.mobile.loading('hide', { textVisible: false });
        }).error(function (err) {
            SendAlert("Failed to load data - " + JSON.stringify(err));
            $.mobile.loading('hide', { textVisible: false });
        });
    } catch (ex) {
        SendAlert("Ops! " + ex.message);
        $.mobile.loading('hide', { textVisible: false });
    }
}