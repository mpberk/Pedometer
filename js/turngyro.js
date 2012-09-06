
var curr_gyro_angle = 0;
var curr_gyro_z = 0;
var stop_angle = 0;
var turn_threshold = 10;
var first_time = 0;
var start_turn = 0;

var turnprintcount = 0;
var finished_turn = 0;
 

function initgyro() {
    curr_gyro_z = SensorState.gyro.z;
    curr_gyro_angle += -curr_gyro_z * getReadingInterval / 1000;
    start_turn = 0;
    finished_turn = 0;
    //   turn_threshold = 5;
}

function turnfromgyro() {

    curr_gyro_z = SensorState.gyro.z;
    curr_gyro_angle += (-curr_gyro_z * getReadingInterval) / 1000;
    curr_gyro_angle %= 360;


    if (Math.abs(curr_gyro_angle) > turn_threshold) {
        start_turn = 1;

    }

    if (Math.abs(curr_gyro_z) < 1 && start_turn == 1) {
        stop_angle = curr_gyro_angle;

        if (TurnMode == 0) {
            if (curr_gyro_angle > 0 && curr_gyro_angle < 45)
                stop_angle = 0;
            else if (curr_gyro_angle > 45 && curr_gyro_angle <= 90)
                stop_angle = 90;
            else if (curr_gyro_angle > 90 && curr_gyro_angle <= 135)
                stop_angle = 90;
            else if (curr_gyro_angle > 135 && curr_gyro_angle <= 180)
                stop_angle = 180;
            else if (curr_gyro_angle > 180 && curr_gyro_angle <= 225)
                stop_angle = 180;
            else if (curr_gyro_angle > 225 && curr_gyro_angle <= 270)
                stop_angle = 270;
            else if (curr_gyro_angle > 270 && curr_gyro_angle <= 315)
                stop_angle = 270;
            else if (curr_gyro_angle > 315 && curr_gyro_angle < 360)
                stop_angle = 0;
            else if (curr_gyro_angle < 0 && curr_gyro_angle >= -45)
                stop_angle = 0;
            else if (curr_gyro_angle < -45 && curr_gyro_angle >= -90)
                stop_angle = -90;
            else if (curr_gyro_angle < -90 && curr_gyro_angle >= -135)
                stop_angle = -90;
            else if (curr_gyro_angle < -135 && curr_gyro_angle >= -180)
                stop_angle = -180;
            else if (curr_gyro_angle < -180 && curr_gyro_angle >= -225)
                stop_angle = -180;
            else if (curr_gyro_angle < -225 && curr_gyro_angle >= -270)
                stop_angle = -270;
            else if (curr_gyro_angle < -270 && curr_gyro_angle >= -315)
                stop_angle = -270;
            else if (curr_gyro_angle < -315 && curr_gyro_angle >= -359)
                stop_angle = 0;
            if (stop_angle != 0) {
                AddTapMessageRow("Snap Angle" + stop_angle.toFixed(2));
                finished_turn = stop_angle;
            }
        }
        else {
            AddTapMessageRow("Turn Angle" + stop_angle.toFixed(2));
        }
        curr_gyro_angle = 0;
        start_turn = 0;

    }
}




