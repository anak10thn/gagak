
(function() {
  var PushServiceAPNS, apns,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  apns = require('apn');

  PushServiceAPNS = (function() {
    PushServiceAPNS.prototype.tokenFormat = /^[0-9a-f]{64}$/i;

    PushServiceAPNS.prototype.validateToken = function(token) {
      if (PushServiceAPNS.prototype.tokenFormat.test(token)) {
        return token.toLowerCase();
      }
    };

    function PushServiceAPNS(conf, logger, tokenResolver) {
      this.logger = logger;
      conf.errorCallback = (function(_this) {
        return function(errCode, note) {
          var ref;
          return (ref = _this.logger) != null ? ref.error("APNS Error " + errCode + ": " + note) : void 0;
        };
      })(this);
      conf['gateway'] || (conf['gateway'] = 'gateway.push.apple.com');
      conf['address'] || (conf['address'] = 'feedback.push.apple.com');
      this.driver = new apns.Connection(conf);
      this.payloadFilter = conf.payloadFilter;
      this.conf = conf;
      this.feedback = new apns.Feedback(conf);
      this.feedback.on('feedback', (function(_this) {
        return function(feedbackData) {
          var ref;
          if ((ref = _this.logger) != null) {
            ref.debug("APNS feedback returned " + feedbackData.length + " devices");
          }
          return feedbackData.forEach(function(item) {
            return tokenResolver('apns', item.device.toString(), function(subscriber) {
              return subscriber != null ? subscriber.get(function(info) {
                var ref1;
                if (info.updated < item.time) {
                  if ((ref1 = _this.logger) != null) {
                    ref1.warn("APNS Automatic unregistration for subscriber " + subscriber.id);
                  }
                  return subscriber["delete"]();
                }
              }) : void 0;
            });
          });
        };
      })(this));
    }

    PushServiceAPNS.prototype.push = function(subscriber, subOptions, payload) {
      return subscriber.get((function(_this) {
        return function(info) {
          var alert, badge, category, contentAvailable, device, key, note, ref, val;
          note = new apns.Notification();
          device = new apns.Device(info.token);
          device.subscriberId = subscriber.id;
          if ((subOptions != null ? subOptions.ignore_message : void 0) !== true && (alert = payload.localizedMessage(info.lang))) {
            note.alert = alert;
          }
          badge = parseInt(payload.badge || info.badge);
          if (payload.incrementBadge) {
            badge += 1;
          }
          category = payload.category;
          contentAvailable = payload.contentAvailable;
          if ((contentAvailable == null) && (_this.conf.contentAvailable != null)) {
            contentAvailable = _this.conf.contentAvailable;
          }
          if ((category == null) && (_this.conf.category != null)) {
            category = _this.conf.category;
          }
          if (!isNaN(badge)) {
            note.badge = badge;
          }
          note.sound = payload.sound;
          note.category = category;
          note.contentAvailable = contentAvailable;
          if (_this.payloadFilter != null) {
            ref = payload.data;
            for (key in ref) {
              val = ref[key];
              if (indexOf.call(_this.payloadFilter, key) >= 0) {
                note.payload[key] = val;
              }
            }
          } else {
            note.payload = payload.data;
          }
          _this.driver.pushNotification(note, device);
          if (payload.incrementBadge) {
            return subscriber.incr('badge');
          }
        };
      })(this));
    };

    return PushServiceAPNS;

  })();

  exports.PushServiceAPNS = PushServiceAPNS;

}).call(this);
