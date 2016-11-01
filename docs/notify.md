##Documentaion SQUID.IO##

![squidio](http://i.imgur.com/L3vbmAc.jpg?1)

pesan yang dikirim keservice squid.io menggunakan UDP,
###example code :###

```
<?php
$squidHost = '127.0.0.1';
$squiddPort = 8080;
$eventName = 'pesan-id1234';
$payload = array
(
    'msg' => 'fulan mengirimkanmu video: hentai',
    'data.user_id' => '1234',
    'data.video_id' => 'message_id'
);
$msg = gzcompress('POST /event/' . urldecode($eventName) . '?' . http_build_query($payload));
$socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_sendto($socket, $msg, strlen($msg), 0, $squidHost, $squidPort);
socket_close($socket);
?>
```

###output :###
```
data: {"event":"pesan-id1234","title":{},"message":{"default":"ah kamu"},"data":{"user_id":"1234","message_id":"1k3dxk"}}
```

###demo :###

client : http://jsbin.com/mekas/1/edit
server : http://squid.ignsdk.web.id/notify.php
