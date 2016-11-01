dapatkan idnya dulu
```bash
curl -d proto=gcm \
-d token=cKXmAHlVj_4:APA91bE2nedrRsCmJqmkvxbMVhyfcWxjaew1_Ti3cLqxVhD6fpq27hUded93IiJJ1DCFbWPtQKXucVRzRPESTPtyAhvwOOCY2_DDSESan_L0D_18Mv1LmLxvyzfrtssHcxzlKKKFjFHh \
-d lang=en \
-d badge=0 \
http://localhost:8080/subscribers
```

respons
```bash
{
  "proto": "gcm",
  "token": "cKXmAHlVj_4:APA91bE2nedrRsCmJqmkvxbMVhyfcWxjaew1_Ti3cLqxVhD6fpq27hUded93IiJJ1DCFbWPtQKXucVRzRPESTPtyAhvwOOCY2_DDSESan_L0D_18Mv1LmLxvyzfrtssHcxzlKKKFjFHh",
  "lang": "en",
  "badge": 0,
  "created": 1477999280,
  "updated": 1477999605,
  "id": "VUZ4lhMTQ-o"
}
```

lakukan subscribe
```bash
curl -X POST http://localhost:6060/subscriber/[id_subscribe]/subscriptions/[id_user]
```
```bash
contoh
curl -X POST http://localhost:6060/subscriber/VUZ4lhMTQ-o/subscriptions/pesan-id1234
```

refresh id setiap restart apps
```bash
curl -d lang=en -d badge=0 http://localhost:6060/subscriber/[id_subscribe]
```
