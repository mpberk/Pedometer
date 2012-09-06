var curr_compass_pos;
var compass_threshhold ;
var first_time ;
var stable_compass_pos; 

function initcompass() {
    curr_compass_pos = SensorState.compass.magNorth;
    stable_compass_pos= curr_compass_pos;
    compass_threshhold = 5;
    first_time = 0;
}

function turnfromcompass() {

    
    curr_compass_pos = SensorState.compass.magNorth;

    if (first_time == 0 ) {
        stable_compass_pos = curr_compass_pos;
        first_time = 1;
    }

    if (!((curr_compass_pos != stable_compass_pos) && (curr_compass_pos <= stable_compass_pos + compass_threshhold) && (curr_compass_pos >= compass_pos - compass_threshhold))){
        stable_compass_pos = curr_compass_pos;
       }
  //  AddTapMessageRow("Current Compass Position" + stable_compass_pos);
    }


 