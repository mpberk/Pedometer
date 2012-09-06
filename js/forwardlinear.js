var accelY = new Array (0.00, 0.00, 0.00, 0.00);
var accelYavg = new Array(0.00, 0.00, 0.00);
var totaldisplacement = 0;
var time = 0;
var old_velocity = 0;
var change_in_velocity = 0;

 
var printcount = 0;

function accelYinit() {
    accelY = [0.00, 0.00, 0.00, 0.00];
    accelYavg = [0.00, 0.00, 0.00, 0.00];
    displacement = 0;
    totaldisplacement = 0;
    old_velocity = 0;
    change_in_velocity = 0;
    time = 0;
    
}

function accelYintegrate() {
    time = getReadingInterval / 1000;
    var accelY_tot = 0;
    for (var i = 0; i < accelY.length; i++) {
        accelY_tot = accelY_tot + accelY[i];
    }
    accelYavg.unshift(((accelY_tot / accelY.length) * 9.8).toFixed(2));

    accelYavg[0] = parseFloat(accelYavg[0]);
    accelYavg[1] = parseFloat(accelYavg[1]);
    accelYavg[2] = parseFloat(accelYavg[2]);
    
    change_in_velocity = ((accelYavg[0] + accelYavg[1]) / 2) * time;
    displacement = ( (change_in_velocity + (old_velocity * 2)) / 2 ) * time;
    totaldisplacement += displacement;
    old_velocity += change_in_velocity;
    
    if (printcount == 60) {
        printcount = 0;
        AddTapMessageRow("Displacement: " + Math.abs(totaldisplacement.toFixed(2)) + " meters");
    }
    else
        printcount++;
}

function linearmotiondetect() {
    accelY.pop();
    if (SensorState.accel.y > -0.05 && SensorState.accel.y < 0.05) {
        accelY.unshift(0.00);
    }
    else {
        accelY.unshift(SensorState.accel.y);
    }
    accelYavg.pop();
    accelYintegrate();
}