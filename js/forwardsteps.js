var steps_prevVal = 1.0;
var steps_prevprevVal = 1.0;
var steps_peakLow = 0;
var steps_peakHigh = 0;
var steps_samplesSinceHighPeak = 0;
var steps_samplesSinceLowPeak = 0;
var steps = 0;

var peakMinSamplesBetween = 15;
var highLowPeakDiff = .2;
var accelerometerZNeutral = -1.1;
var accelerometerZNeutralLowOffset = -.04;
var accelerometerZNeutralHighOffset = .06;
var lastpeak = 1;// 1 is low 0 is high

function reset_step() {
    steps = 0;
} 

function stepmotiondetect() {

    peakMinSamplesBetween = getSliderValue("sliderLabel1");
    highLowPeakDiff = getSliderValue("sliderLabel2");
    var x = SensorState.accel.x;
    var y = SensorState.accel.y;
    var z = SensorState.accel.z;
    var magnitude = z; //Math.sqrt(x * x + y * y + z * z);

    //AddTapMessageRow("val: " + magnitude);

    if (magnitude < steps_prevVal && steps_prevprevVal < steps_prevVal && steps_samplesSinceHighPeak > peakMinSamplesBetween && steps_prevVal > accelerometerZNeutral + accelerometerZNeutralHighOffset&& lastpeak == 1) {
        steps_peakHigh = steps_prevVal;
        steps_samplesSinceHighPeak = 0;
        //AddTapMessageRow("HighPeak: " + steps_peakHigh);
        if (Math.abs(steps_peakHigh - steps_peakLow) > highLowPeakDiff) {

            steps++;
            AddTapMessageRow("Steps: "+steps);
        }
        lastpeak = 0;
    }
    else
        steps_samplesSinceHighPeak++;
    if (magnitude > steps_prevVal && steps_prevprevVal > steps_prevVal && steps_samplesSinceLowPeak > peakMinSamplesBetween && steps_prevVal < accelerometerZNeutral + accelerometerZNeutralLowOffset && lastpeak == 0) {
        steps_peakLow = steps_prevVal;
        //AddTapMessageRow("LowPeak: " + steps_peakLow);
        steps_samplesSinceLowPeak = 0;
        lastpeak =1;
    }
    else
        steps_samplesSinceLowPeak++;
    if (magnitude != steps_prevVal) {
        steps_prevprevVal = steps_prevVal;
        steps_prevVal = magnitude;
    }


    
    //id('readingOutputMagnitude').innerHTML = magnitude;
    //id('readingOutputSteps').innerHTML = steps; //crosses / 2;
    //id('readingOutputsteps_peakHigh').innerHTML = steps_peakHigh;
    //id('readingOutputsteps_peakLow').innerHTML = steps_peakLow;
    //id('readingOutputPeakDiff').innerHTML = steps_peakHigh - steps_peakLow;
}


