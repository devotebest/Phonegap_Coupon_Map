var GeoLocation = {
    latitude: '',
    longitude: '',
    ClientCallBack: null,
    ClientErrorCallBack: null,
    // onSuccess Callback
    // This method accepts a Position object, which contains the
    // current GPS coordinates
    //
    onSuccess: function (position) {
		//alert("geoSuccess");
		
        //GeoLocation.latitude = position.coords.latitude.toString();
        //GeoLocation.longitude = position.coords.longitude.toString();
		
		GeoLocation.latitude = "43.3871960";
        GeoLocation.longitude = "-116.2344320";
		
        GeoLocation.isProcessing = false;
        if (GeoLocation.ClientCallBack) {
            GeoLocation.ClientCallBack();
        }
    },

    // onError Callback receives a PositionError object
    //
    onError: function (error) {
        this.isProcessing = false;
        if (GeoLocation.ClientErrorCallBack) {
            GeoLocation.ClientErrorCallBack();
        }
    },

    getCurrent: function (resultCB, errorCB) {
        this.ClientCallBack = resultCB;
        this.ClientErrorCallBack = errorCB;
        this.isProcessing = true;
		this.onSuccess();
        navigator.geolocation.getCurrentPosition(this.onSuccess, this.onError, { timeout: 15000, enableHighAccuracy: true });
    },
    isProcessing: false
}