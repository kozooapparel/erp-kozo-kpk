<?php
header("Content-Type:text/plain");
$dbkonek = mysqli_connect("localhost", "root", "");
$dbopen1 = mysqli_select_db($dbkonek, 'webhook');
if ($dbopen1 == 1) {
    $json_result = stripcslashes(file_get_contents('php://input'));
    $arjson = json_decode($json_result);
    if (!empty($arjson)) {
        // send response OK immediately
        echo "OK";
        if ($arjson->biohook == 'clockreco') {
            // do something
        } elseif ($arjson->biohook == 'clockfoto') {
            // do something
        }
    } else {
        echo "EMPTY";
    }
} else {
    echo "ERROR";
}
