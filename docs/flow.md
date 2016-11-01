dapatkan idnya dulu
```bash
curl -d proto=apns-dev \
-d token=183fcbd65133121a1ea8dfeeb6890ae5d1380f57f25af251662387a98affc9d1 \
-d lang=en \
-d badge=0 \
http://localhost:6060/subscribers
```

respons
```bash
{
  "proto": "apns-dev",
  "token": "183fcbd65133121a1ea8dfeeb6890ae5d1380f57f25af251662387a98affc9d1",
  "lang": "en",
  "badge": 0,
  "updated": 1395492159,
  "created": 1395492159,
  "id": "zP_nihP_Qc4"
}
```

lakukan subscribe
```bash
curl -X POST http://localhost:6060/subscriber/[id_subscribe]/subscriptions/[id_user]
contoh
curl -X POST http://localhost:6060/subscriber/zP_nihP_Qc4/subscriptions/904
```

refresh id setiap restart apps
```bash
curl -d lang=en -d badge=0 http://localhost:6060/subscriber/[id_subscribe]
```
