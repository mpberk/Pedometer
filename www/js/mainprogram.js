       var SensorStateClass = WinJS.Class.define(
    null,
    {
        accel: {
            Available: false,
            Enabled: false,
            intervalId: 0,
            getReadingInterval: 0,
            accelerometer: null,
            x: 0,
            y: 0,
            z: 0,
        },
        gyro: {
            Available: false,
            Enabled: false,
            intervalId: 0,
            getReadingInterval: 0,
            gyrometer: null,
            x: 0,
            y: 0,
            z: 0,
        },
        compass: {
            Available: false,
            cEnabled: false,
            intervalId: 0,
            getReadingInterval: 0,
            compassdevice: null,
            magNorth: 0,
            trueNorth: 0,
        },
        gps: {
            Available: false,
            Enabled: false,
            intervalId: 0,
            getReadingInterval: 0,
            gpsdevice: null,
            longitude: 0.0,
            latitude: 0.0,
            accuracy: 0.0,
        }

    });

var CalculatedStateClass = WinJS.Class.define(
    null,
    {
        longitude: 0.0,
        latitude: 0.0,
        accuracy: 0.0,
        x: 0.0,
        y: 0.0,
        z: 0.0,
        orientation: 0,      //0 is in  initial y direction
        calibratedorient: 0,  //compass angle at calibration
        fwdmotion: {
            Available: false,
            Enabled: false,
            distancesinceturn: 0.0,
            x: 0,
            y: 0,
            z: 0,
        },
        turndetect: {
            Available: false,
            Enabled: false,
            turnsincemotion: 0.0,
            x: 0,
            y: 0,
            z: 0,
        },
        goodgps: {

            longitude: 0.0,
            latitude: 0.0,
            accuracy: 0.0,
        }

    });

var CalculatedState = new CalculatedStateClass();
var SensorState = new SensorStateClass();
var getReadingInterval = 16;
var DebugMessageRow = 0;
var MotionLogRow = 0;
var MotionLogColumn = 0;
var ModeButtonState = 0;   // 0 = Indoor  1 = Outdoor
var TurnMode = 0   // 0 = Snap    1 = Variable
var Stride = 0.5;  //in meters
var MotionType = 0;        // 0 = Step    1 = Linear
var debugmsgen = true;
var motionmsgen = true;
var posdone = 0;
var posnotdone = 1;
var poshandler = posdone;
var gpschanged = false;
var gpsthreshold = 16; //accuracy
var Rearth = 6371000;// radius of earth meters
var forcegpsuse = false;
var gpsinterval = 5;
var gpsturn = 0;
function AddTapMessageRow(message) {
    if (debugmsgen) {
        DebugMessageRow++;
        var t = document.getElementById('debugTable');
        var x = t.insertRow(DebugMessageRow);
        var y = x.insertCell(0);

        y.innerHTML = DebugMessageRow.toString() + " " + message;
        var m = document.getElementById('DebugMessages');
        m.scrollTop = m.scrollHeight;
    }
}


function Cleardebugtable() {
    while (DebugMessageRow) { document.getElementById('debugTable').deleteRow(DebugMessageRow); DebugMessageRow--; }
    document.getElementById('debugTable').rules = "rows";
}


function AddMotionLogRow(message, message2) {
    if (motionmsgen) {
        MotionLogRow++;
        var t = document.getElementById('motionlogTable');
        LastRow = t.insertRow(MotionLogRow);
        Column1 = LastRow.insertCell(0);
        Column2 = LastRow.insertCell(1);

        Column1.innerHTML = MotionLogRow.toString() + " " + message;
        Column2.innerHTML = "   " + message2;
        var m = document.getElementById('MotionLog');
        m.scrollTop = m.scrollHeight;
    }
}


function UpdateMotionLogLastRow(message, message2) {
    if (motionmsgen) {
        if (MotionLogRow > 0) {
            Column1.innerHTML = MotionLogRow.toString() + " " + message;
            Column2.innerHTML = "   " + message2;
            var m = document.getElementById('MotionLog');
            m.scrollTop = m.scrollHeight;
        }
    }
}



function ClearmotionLogTable() {
    while (MotionLogRow) { document.getElementById('motionlogTable').deleteRow(MotionLogRow); MotionLogRow--; }
    document.getElementById('motionlogTable').rules = "rows";
}


function getSliderValue(sliderID) {
    var t = document.getElementById(sliderID);
    return parseFloat(t.textContent);
}


(function () {

    var threshold = 10;
    //var steps = 0;
    var loa = 1.0;
    var hia = 1.0;
    var preva = 0;
    var avga = 0;
    var numsamples = 20;
    var samples = 0;
    var trend = 0;
    var up = 1; down = -1;
    var notfound = "not found";
    var deviceon = "on";
    var deviceoff = "off";
    var modeIndoor = "Indoor";
    var modeOutdoor = "Outdoor";
    var turnsSnap = "Snap";
    var turnsVariable = "Variable";
    var motionTypeStep = "Step";
    var motionTypeLinear = "Linear";
    var devicesPolled = 0;
    var intervalId = 0;
    var LastRow = 0;
    var Column1 = 0
    var Column1 = 1;
    var oldSteps = 0;


    function id(elementId) {
        return document.getElementById(elementId);
    }

    /*
    function ChangeMotionLogLastCell(message) {
        var t = document.getElementById('motionlogTable');
        var x = t.insertRow(MotionLogRow);
        var y = x.insertCell(0);
        var z = x.insertCell(1);

        y.innerHTML = MotionLogRow.toString() + " " + message;
        z.innerHTML = MotionLogRow.toString() + " " + message2;
        var m = document.getElementById('MotionLog');
        m.scrollTop = m.scrollHeight;
    }
*/



    function forwardmotiondetect() {
        if (MotionType == 1) linearmotiondetect();
        if (MotionType == 0) stepmotiondetect();
        /* need to do some more processing here to combine the data and provide final output in the table */

        var incfwdpos = ((steps - oldSteps) * Stride);
        CalculatedState.fwdmotion.distancesinceturn += incfwdpos;

        if (steps != oldSteps) {
            if (CalculatedState.turndetect.turnsincemotion != 0) {
                AddMotionLogRow("STEPS ", CalculatedState.fwdmotion.distancesinceturn + "m");
                CalculatedState.turndetect.turnsincemotion = 0;
            }
            else
                UpdateMotionLogLastRow("STEPS ", CalculatedState.fwdmotion.distancesinceturn + "m");
            updatexyz(incfwdpos);
            oldSteps = steps;
        }
    }
    function updateOrientation(angle) {
        CalculatedState.orientation += angle;
        CalculatedState.orientation %= 360;
        if (Math.abs(CalculatedState.orientation) >= 180) {
            if (CalculatedState.orientation > 180) {
                CalculatedState.orientation -= 360;
            } else if (CalculatedState.orientation <= -180) {
                CalculatedState.orientation += 360;
            }
        }
        id('worldo').innerHTML = CalculatedState.orientation;
    }
    function turndetect() {
        turnfromgyro();
        //turnfromcompass();
        /* need to do some more processing here to combine the data and provide final output in the table */
        if (finished_turn) {
            CalculatedState.turndetect.turnsincemotion = finished_turn;
            finished_turn = 0;
            AddMotionLogRow("TURN ", CalculatedState.turndetect.turnsincemotion + "deg");
            updateOrientation(CalculatedState.turndetect.turnsincemotion);
            CalculatedState.fwdmotion.distancesinceturn = 0.0;
        }
    }
    function cleangpsOutput() {
        id('gps_status').innerHTML = " ";
        id('latitude').innerHTML = "waiting...";
        id('longitude').innerHTML = "waiting...";
        id('accuracy').innerHTML = "waiting...";

    }

    function getPositionHandler(pos) {
        if (pos) {
            if ((SensorState.gps.latitude == pos.coords.latitude) && (SensorState.gps.longitude == pos.coords.longitude)) {
                gpschanged = false;
            } else {
                SensorState.gps.latitude = pos.coords.latitude;
                SensorState.gps.longitude = pos.coords.longitude;
                SensorState.gps.accuracy = pos.coords.accuracy;
                id('latitude').innerHTML = SensorState.gps.latitude.toFixed(6);
                id('longitude').innerHTML = SensorState.gps.longitude.toFixed(6);
                id('accuracy').innerHTML = SensorState.gps.accuracy;
                gpschanged = true;
                if (SensorState.gps.accuracy > gpsthreshold) {
                    document.getElementById("position_status").textContent = ("position not accurate");
                }
                else {
                    document.getElementById("position_status").textContent = ("position accurate");
                }
                document.getElementById("gps_status").textContent = (" ");
            }
        } else {
            document.getElementById("gps_status").textContent = ("no position fix");
        }
        poshandler = posdone;
    }

    function getPositionErrorHandler(err) {
        document.getElementById("gps_status").textContent = err.message;
        poshandler = posdone;
    }
    function getloc() {
        //cleangpsOutput();

        //SensorState.gps.gpsdevice.addEventListener("positionchanged", ongpsPositionChanged);
        //SensorState.gps.gpsdevice.addEventListener("statuschanged", ongpsStatusChanged);
        poshandler = posnotdone; gpsturn = 0;
        //SensorState.gps.gpsdevice.getGeopositionAsync().done(getPositionHandler, getPositionErrorHandler);
        navigator.geolocation.getCurrentPosition(getPositionHandler, getPositionErrorHandler);
    }
    function cleancalcgpsOutput() {
        //id('gps_status').innerHTML = " ";
        id('calclatitude').innerHTML = "waiting...";
        id('calclongitude').innerHTML = "waiting...";
        //id('accuracy').innerHTML = "waiting...";

    }
    function showcalcgpsOutput() {
        //id('gps_status').innerHTML = " ";
        id('calclatitude').innerHTML = CalculatedState.latitude.toFixed(6);
        id('calclongitude').innerHTML = CalculatedState.longitude.toFixed(6);
        //id('accuracy').innerHTML = "waiting...";

    }
    function resetmotionduetonewgpsfix() {
        reset_step(); oldSteps = 0;
        //accelYinit();
        //initcompass();
        initgyro();
        clearcalculatedstate();
    }
    function GPSfixdetect() {
        if (gpschanged || forcegpsuse) {
            if ((SensorState.gps.accuracy <= gpsthreshold)|| forcegpsuse) {
                CalculatedState.goodgps.latitude = SensorState.gps.latitude;
                CalculatedState.goodgps.longitude = SensorState.gps.longitude;
                CalculatedState.goodgps.accuracy = SensorState.gps.accuracy;
                resetmotionduetonewgpsfix();
                CalculatedState.calibratedorient = SensorState.compass.magNorth;
                id('bearing').innerHTML = CalculatedState.calibratedorient;
                if (forcegpsuse) {
                    toggleforcegpsMode();
                }
            }

            gpschanged = false;

        }
    }
    function showxyz() {
        id('worldx').innerHTML = CalculatedState.x;
        id('worldy').innerHTML = CalculatedState.y;
        id('worldz').innerHTML = CalculatedState.z;

    }
    function clearxyz() {
        CalculatedState.x = 0;
        CalculatedState.y = 0;
        CalculatedState.z = 0;
        showxyz();
    }


    function clearcalculatedstate() {
        clearxyz();
        updateOrientation(-CalculatedState.orientation);
        CalculatedState.calibratedorient = SensorState.compass.magNorth;
        CalculatedState.turndetect.turnsincemotion = 0;

        CalculatedState.fwdmotion.distancesinceturn = 0;
    }

    function updatexyz(incfwdpos) {
        if (CalculatedState.orientation == 0) {
            CalculatedState.y += incfwdpos;
        } else if (CalculatedState.orientation == 90) {
            CalculatedState.x += incfwdpos;
        } else if (CalculatedState.orientation == -90) {
            CalculatedState.x -= incfwdpos;
        } else if (CalculatedState.orientation == 180) {
            CalculatedState.y -= incfwdpos;

        }
        CalculatedState.z = 0;
        showxyz();
    }

    function calcnewgps(lon1, lat1, d, brng) { // formula From
        //  http://www.movable-type.co.uk/scripts/latlong.html#destPoint
        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / Rearth) +
                             Math.cos(lat1) * Math.sin(d / Rearth) * Math.cos(brng));
        var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / Rearth) * Math.cos(lat1),
                                     Math.cos(d / Rearth) - Math.sin(lat1) * Math.sin(lat2));
        return { longitude: lon2, latitude: lat2 };
    }
    function calculatefix() {
/*        if (CalculatedState.orientation == 0) {

        } else if (CalculatedState.orientation == 90) {

        } else if (CalculatedState.orientation == -90) {

        } else if (CalculatedState.orientation == 180) {

        }*/
        var d = Math.sqrt(Math.pow(CalculatedState.x, 2) + Math.pow(CalculatedState.y, 2));
        var brng = Math.atan2(CalculatedState.y, CalculatedState.x) + CalculatedState.calibratedorient * Math.PI / 180;
        var longlat = calcnewgps(CalculatedState.goodgps.longitude * Math.PI / 180, CalculatedState.goodgps.latitude * Math.PI / 180, d, brng)
        CalculatedState.longitude = longlat.longitude * 180 / Math.PI;
        CalculatedState.latitude = longlat.latitude * 180 / Math.PI;
        CalculatedState.accuracy = CalculatedState.goodgps.accuracy;
        showcalcgpsOutput();
    }

    function ProcessData() {
        if (SensorState.accel.Enabled)
            forwardmotiondetect();
        if (SensorState.gyro.Enabled)
            turndetect();
        if (SensorState.gps.Enabled)
            GPSfixdetect();
        calculatefix();

    }

    function getCurrentReading() {
        var x, y, z, reading;
        if (SensorState.accel.Enabled) {
            reading = navigator.accelerometer.getCurrentAcceleration(
                function(reading) {
                    x = id('accelOutputX').innerHTML = reading.x.toFixed(2);
                    y = id('accelOutputY').innerHTML = reading.y.toFixed(2);
                    z = id('accelOutputZ').innerHTML = reading.z.toFixed(2);
                    SensorState.accel.x = parseFloat(x);
                    SensorState.accel.y = parseFloat(y);
                    SensorState.accel.z = parseFloat(z);
                }
            )
        }
        if (SensorState.gyro.Enabled) {
            reading = SensorState.gyro.gyrometer.getCurrentReading();
            if (reading) {
                x = id('gyroOutputX').innerHTML = reading.angularVelocityX.toFixed(2);
                y = id('gyroOutputY').innerHTML = reading.angularVelocityY.toFixed(2);
                z = id('gyroOutputZ').innerHTML = reading.angularVelocityZ.toFixed(2);
                SensorState.gyro.x = parseFloat(x);
                SensorState.gyro.y = parseFloat(y);
                SensorState.gyro.z = parseFloat(z);
            }
        }
        if (SensorState.compass.Enabled) {
            reading = navigator.compass.getCurrentHeading(
            function (reading) {
                var magnorth = id('magneticNorth').innerHTML = reading.magneticHeading.toFixed(2);
                SensorState.compass.magNorth = parseFloat(magnorth);
                if (reading.headingTrueNorth) {
                    var truenorth = id('trueNorth').innerHTML = reading.trueHeading.toFixed(2);
                    SensorState.compass.trueNorth = parseFloat(truenorth);
                } else {
                    id('trueNorth').innerHTML = "no data";
                }
            }, function () { }
            );
        }
        if (SensorState.gps.Enabled) {
           // gpschanged = false;
            if (poshandler == posdone) {
                if (gpsturn++  > gpsinterval) getloc();
            }
        }
        ProcessData();
    }

    function enableInterval() {
        if (devicesPolled == 0)
            intervalId = setInterval(getCurrentReading, getReadingInterval);
        devicesPolled++;
    }

    function disableInterval() {
        if (devicesPolled == 1)
            clearInterval(intervalId);
        devicesPolled--;
    }


    function toggleAccelerometer() {
        if (SensorState.accel.Available) {
            if (SensorState.accel.Enabled) {
                SensorState.accel.Enabled = false;
                disableInterval();
                document.getElementById("accelStatus").textContent = deviceoff;
                document.getElementById("AccelEnable").style.background = 'Gray';
                // ClearmotionLogTable(); //debug only
            }
            else {
                SensorState.accel.Enabled = true;
                enableInterval();
                document.getElementById("accelStatus").textContent = deviceon;
                document.getElementById("AccelEnable").style.background = 'Green';

            }
        }
    }
    function toggleGyrometer() {
        if (SensorState.gyro.Available) {
            if (SensorState.gyro.Enabled) {
                SensorState.gyro.Enabled = false;
                disableInterval();
                document.getElementById("gyroStatus").textContent = deviceoff;
                document.getElementById("GyroEnable").style.background = 'Gray';
                //   disableGyro();
            }
            else {
                SensorState.gyro.Enabled = true;
                enableInterval();
                document.getElementById("gyroStatus").textContent = deviceon;
                document.getElementById("GyroEnable").style.background = 'Green';
                //    enableGyro();
            }
        }
    }
    function toggleCompass() {
        if (SensorState.compass.Available) {
            if (SensorState.compass.Enabled) {
                SensorState.compass.Enabled = false;
                disableInterval();
                document.getElementById("compassStatus").textContent = deviceoff;
                document.getElementById("CompassEnable").style.background = 'Gray';
                //   disableCompass();
            }
            else {
                SensorState.compass.Enabled = true;
                enableInterval();
                document.getElementById("compassStatus").textContent = deviceon;
                document.getElementById("CompassEnable").style.background = 'Green';
                //   enableCompass();
            }
        }
    }
    function toggleGPS() {
        if (SensorState.gps.Available) {
            if (SensorState.gps.Enabled) {
                SensorState.gps.Enabled = false;
                disableInterval();
                document.getElementById("gpsStatus").textContent = deviceoff;
                document.getElementById("GPSEnable").style.background = 'Gray';

                //disableGPS();
            }
            else {
                SensorState.gps.Enabled = true;
                enableInterval();
                document.getElementById("gpsStatus").textContent = deviceon;
                document.getElementById("GPSEnable").style.background = 'Green';
                // enableGPS();
            }
        }
    }




    function onSliderStrideChanged(value) {
        var t = document.getElementById('sliderStride');
        Stride = t.textContent = value;
    }


    function onMySliderOneChanged(value) {
        var t = document.getElementById('sliderLabel1');
        t.textContent = value;
    }


    function onMySliderTwoChanged(value) {
        var t = document.getElementById('sliderLabel2');
        t.textContent = value;
    }

    function onGyroThresholdSliderChanged(value) {
        var t = document.getElementById('turn_thresholdLabel');
        t.textContent = value;

        turn_threshold = value;
    }


    function Reset() {
        //      initialize();
        reset_step(); oldSteps = 0;
        accelYinit();
        initcompass();
        initgyro();
        clearcalculatedstate();

        Cleardebugtable();
        ClearmotionLogTable();
        AddMotionLogRow(" ", " ");
        //        Samples between peaks
        //Min peak to peak distance

        // To reset controls back to original values uncomment the following code.
        /*      document.getElementById("StrideRange").value = 2.0;
        document.getElementById('sliderStride').textContent = "2.0";
        document.getElementById("pollRateSelect").value = 16;
        ModeButtonState = 0;   // 0 = Indoor  1 = Outdoor
        document.getElementById("modeLabel").textContent = modeIndoor;
        TurnMode = 0;
        document.getElementById("turnLabel").textContent = turnsSnap;
        MotionType = 0;
        document.getElementById("motionTypeLabel").textContent = motionTypeStep;*/
    }
    function toggledebugmsgMode() {
        debugmsgen = !debugmsgen;
        if (!debugmsgen) {
            document.getElementById("debuglogvalue").textContent = deviceoff;
        }
        else {
            document.getElementById("debuglogvalue").textContent = deviceon;
        }
    }

    function toggleforcegpsMode() {
        forcegpsuse = !forcegpsuse;
        if (!forcegpsuse) {
            document.getElementById("forcegpsvalue").textContent = "oneshot";
        }
        else {
            document.getElementById("forcegpsvalue").textContent = deviceon;
        }
    }

    function togglemotionmsgMode() {
        motionmsgen = !motionmsgen;
        if (!motionmsgen) {
            document.getElementById("motionlogvalue").textContent = deviceoff;
        }
        else {
            document.getElementById("motionlogvalue").textContent = deviceon;
        }
    }

    function toggleMode() {
        ModeButtonState = !ModeButtonState;
        if (!ModeButtonState) {
            document.getElementById("modeLabel").textContent = modeIndoor;
        }
        else {
            document.getElementById("modeLabel").textContent = modeOutdoor;
        }
    }



    function toggleTurns() {
        TurnMode = !TurnMode;
        if (!TurnMode) {
            document.getElementById("turnLabel").textContent = turnsSnap;
        }
        else {
            document.getElementById("turnLabel").textContent = turnsVariable;
        }
    }


    function toggleMotionType() {
        MotionType = !MotionType;
        if (!MotionType) {
            document.getElementById("motionTypeLabel").textContent = motionTypeStep;
        }
        else {
            document.getElementById("motionTypeLabel").textContent = motionTypeLinear;
        }
    }


    function onSelectPollRate(value) {
        getReadingInterval = value;
    }


    function Calibrate() {
        updateOrientation(-CalculatedState.orientation);

    }



    function initialize() {

        id("AccelEnable").addEventListener("click", /*@static_cast(EventListener)*/toggleAccelerometer, false);
        id("GyroEnable").addEventListener("click", /*@static_cast(EventListener)*/toggleGyrometer, false);
        id("CompassEnable").addEventListener("click", /*@static_cast(EventListener)*/toggleCompass, false);
        id("GPSEnable").addEventListener("click", /*@static_cast(EventListener)*/toggleGPS, false);
        id("ButtonReset").addEventListener("click", /*@static_cast(EventListener)*/Reset, false);
        id("ButtonMode").addEventListener("click", /*@static_cast(EventListener)*/toggleMode, false);
        id("ButtonTurns").addEventListener("click", /*@static_cast(EventListener)*/toggleTurns, false);
        id("ButtonMotionType").addEventListener("click", /*@static_cast(EventListener)*/toggleMotionType, false);
        id("CalibrateButton").addEventListener("click", /*@static_cast(EventListener)*/Calibrate, false);
        //id("DebugLogButton").addEventListener("click", /*@static_cast(EventListener)*/toggledebugmsgMode, false);
        id("ForceGPScoorduse").addEventListener("click", /*@static_cast(EventListener)*/toggleforcegpsMode, false);
        //id("MotionLogButton").addEventListener("click", /*@static_cast(EventListener)*/togglemotionmsgMode, false);
        // id("scenario3Open").disabled = false;
        // id("scenario3Revoke").disabled = true;
        // id("scenarios").addEventListener("change", /*@static_cast(EventListener)*/resetAll, false);

        // var accelerometer = Windows.Devices.Sensors.Accelerometer.getDefault();
        var accelerometer = navigator.accelerometer;
        SensorState.accel.accelerometer = accelerometer;
        if (SensorState.accel.accelerometer) {
            // Choose a report interval supported by the sensor
            var minimumReportInterval = SensorState.accel.accelerometer.minimumReportInterval;
            var reportInterval = minimumReportInterval > 16 ? minimumReportInterval : 16;
            SensorState.accel.accelerometer.reportInterval = reportInterval;
            SensorState.accel.getReadingInterval = reportInterval;
            getReadingInterval = reportInterval > getReadingInterval ? reportInterval : getReadingInterval;
            SensorState.accel.Available = true;
        } else {
            SensorState.accel.Available = false;
            document.getElementById("accelStatus").textContent = notfound;
        }

        var gyrometer = Windows.Devices.Sensors.Gyrometer.getDefault();
        SensorState.gyro.gyrometer = gyrometer;
        if (SensorState.gyro.gyrometer) {
            // Choose a report interval supported by the sensor
            var minimumReportInterval = SensorState.gyro.gyrometer.minimumReportInterval;
            var reportInterval = minimumReportInterval > 16 ? minimumReportInterval : 16;
            SensorState.gyro.gyrometer.reportInterval = reportInterval;
            SensorState.gyro.getReadingInterval = reportInterval;
            getReadingInterval = reportInterval > getReadingInterval ? reportInterval : getReadingInterval;
            SensorState.gyro.Available = true;
        } else {
            SensorState.gyro.Available = false;
            document.getElementById("gyroStatus").textContent = notfound;
        }

        var compass = Windows.Devices.Sensors.Compass.getDefault();
        SensorState.compass.compassdevice = compass;
        if (compass) {
            // Choose a report interval supported by the sensor
            var minimumReportInterval = compass.minimumReportInterval;
            var reportInterval = minimumReportInterval > 16 ? minimumReportInterval : 16;
            // compass.reportInterval = reportInterval;
            SensorState.compass.getReadingInterval = reportInterval;
            getReadingInterval = reportInterval > getReadingInterval ? reportInterval : getReadingInterval;
            SensorState.compass.Available = true;
        } else {
            SensorState.compass.Available = false;
            document.getElementById("compassStatus").textContent = notfound;
        }

        var gps = new Windows.Devices.Geolocation.Geolocator();
        SensorState.gps.gpsdevice = gps;
        if (gps) {
            SensorState.gps.Available = true;


        }
        else {
            //  SensorState.gps.Available = false;
            document.getElementById("compassStatus").textContent = notfound;
        }
        Reset();
        var pollRateSelection = document.getElementById("pollRateSelect");
        pollRateSelection.addEventListener("change", function (e) {
            onSelectPollRate(pollRateSelection.value);
        }, false);

        var LocalStrideSlider = document.getElementById("StrideRange");
        LocalStrideSlider.addEventListener("change", function (e) {
            onSliderStrideChanged(LocalStrideSlider.value);
        }, false);

        var MySliderOne = document.getElementById("samplesSlider1");
        MySliderOne.addEventListener("change", function (e) {
            onMySliderOneChanged(MySliderOne.value);
        }, false);

        var MySliderTwo = document.getElementById("samplesSlider2");
        MySliderTwo.addEventListener("change", function (e) {
            onMySliderTwoChanged(MySliderTwo.value);
        }, false);

        var GyrothresholdSlider = document.getElementById("turn_thresholdslider");
        GyrothresholdSlider.addEventListener("change", function (e) {
            onGyroThresholdSliderChanged(GyrothresholdSlider.value);
        }, false);



        var loggingDurationSelect = document.getElementById("pollRateSelect");
        var loggingDuration = loggingDurationSelect.options[loggingDurationSelect.selectedIndex].value * 1000;
    }
    document.addEventListener("DOMContentLoaded", initialize, false);

})();