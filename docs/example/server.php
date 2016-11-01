<?php
$squidHost = 'localhost';
$squidPort = 8080;
$eventName = 'pesan-id1234';
$payload = array
(
    'msg' => 'fulan mengirimkanmu video hentai',
    'data.user_id' => '1234',
    'data.video_id' => 'message_id'
);
$msg = gzcompress('POST /event/' . urldecode($eventName) . '?' . http_build_query($payload));
$socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_sendto($socket, $msg, strlen($msg), 0, $squidHost, $squidPort);
socket_close($socket);
?>
