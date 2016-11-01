
(function() {
  exports.server = {
    redis_port: 6379,
    redis_host: 'redis',
    tcp_port: 8080,
    udp_port: 8080,
    access_log: true,
    acl: {
      publish: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']
    }
  };

  exports['event-source'] = {
    enabled: true
  };

  exports['apns'] = {
    enabled: true,
    "class": require('./lib/pushservices/apns').PushServiceAPNS,
    cert: 'apns-cert.pem',
    key: 'apns-key.pem',
    cacheLength: 100,
    payloadFilter: ['messageFrom']
  };

  exports["wns-toast"] = {
    enabled: true,
    client_id: 'ms-app://SID-from-developer-console',
    client_secret: 'client-secret-from-developer-console',
    "class": require('./lib/pushservices/wns').PushServiceWNS,
    type: 'toast',
    launchTemplate: '/Page.xaml?foo=${data.foo}'
  };

  exports['gcm'] = {
    enabled: true,
    "class": require('./lib/pushservices/gcm').PushServiceGCM,
    key: 'GCM API KEY HERE'
  };

  exports['http'] = {
    enabled: true,
    "class": require('./lib/pushservices/http').PushServiceHTTP
  };

  exports['mpns-toast'] = {
    enabled: true,
    "class": require('./lib/pushservices/mpns').PushServiceMPNS,
    type: 'toast',
    paramTemplate: '/Page.xaml?object=${data.object_id}'
  };

  exports['mpns-tile'] = {
    enabled: true,
    "class": require('./lib/pushservices/mpns').PushServiceMPNS,
    type: 'tile',
    tileMapping: {
      title: "${data.title}",
      backgroundImage: "${data.background_image_url}",
      backBackgroundImage: "#005e8a",
      backTitle: "${data.back_title}",
      backContent: "${data.message}",
      smallBackgroundImage: "${data.small_background_image_url}",
      wideBackgroundImage: "${data.wide_background_image_url}",
      wideBackContent: "${data.message}",
      wideBackBackgroundImage: "#005e8a"
    }
  };

  exports['mpns-raw'] = {
    enabled: true,
    "class": require('./lib/pushservices/mpns').PushServiceMPNS,
    type: 'raw'
  };

  exports['logging'] = [
    {
      transport: 'Console',
      options: {
        level: 'info'
      }
    }
  ];

}).call(this);
