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
        $insert = mysqli_query($dbkonek, "INSERT card_hook (datajs) VALUES ('$json_result')");
        if ($arjson->biohook == 'clockreco') {
            // do something
            $creadt = date('Y-m-d H:i:s', time());
            $mesisn = $arjson->biopush->device;
            $tranid = $arjson->biodata->tran_id;
            $userid = $arjson->biodata->user_id;
            $dispnm = $arjson->biodata->disp_nm;
            $trandt = $arjson->biodata->tran_dt;
            $statid = $arjson->biodata->stateid;
            $verify = $arjson->biodata->verify;
            $workco = $arjson->biodata->workcod;
            $ismask = $arjson->biodata->is_mask;
            $bodyte = $arjson->biodata->bodytem;
            $insert = mysqli_query($dbkonek, "INSERT card_reco (create_dt,mesin_sn,tran_id,user_id,disp_nm,tran_dt,stateid,verify,workcod,is_mask,bodytem) VALUES ('$creadt','$mesisn','$tranid','$userid','$dispnm','$trandt','$statid','$verify','$workco','$ismask','$bodyte')");
        } elseif ($arjson->biohook == 'clockfoto') {
            // do something
        }
    } else {
        echo "EMPTY";
    }
} else {
    echo "ERROR";
}
