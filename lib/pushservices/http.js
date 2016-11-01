
(function() {
  var PushServiceHTTP, http, url;

  http = require('http');

  url = require('url');

  PushServiceHTTP = (function() {
    PushServiceHTTP.prototype.validateToken = function(token) {
      var info, ref;
      info = url.parse(token);
      if ((ref = info != null ? info.protocol : void 0) === 'http:' || ref === 'https:') {
        return token;
      }
    };

    function PushServiceHTTP(conf, logger, tokenResolver) {
      this.conf = conf;
      this.logger = logger;
    }

    PushServiceHTTP.prototype.push = function(subscriber, subOptions, payload) {
      return subscriber.get((function(_this) {
        return function(info) {
          var body, options, req;
          options = url.parse(info.token);
          options.method = 'POST';
          options.headers = {
            'Content-Type': 'application/json',
            'Connection': 'close'
          };
          body = {
            event: payload.event.name,
            title: payload.title,
            message: payload.msg,
            data: payload.data
          };
          req = http.request(options);
          req.on('error', function(e) {});
          req.write(JSON.stringify(body));
          return req.end();
        };
      })(this));
    };

    return PushServiceHTTP;

  })();

  exports.PushServiceHTTP = PushServiceHTTP;

}).call(this);
