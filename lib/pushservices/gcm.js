
(function() {
  var PushServiceGCM, gcm;

  gcm = require('node-gcm');

  PushServiceGCM = (function() {
    PushServiceGCM.prototype.validateToken = function(token) {
      return token;
    };

    function PushServiceGCM(conf, logger, tokenResolver) {
      this.logger = logger;
      if (conf.concurrency == null) {
        conf.concurrency = 10;
      }
      this.driver = new gcm.Sender(conf.key, conf.options);
      this.multicastQueue = {};
    }

    PushServiceGCM.prototype.push = function(subscriber, subOptions, payload) {
      return subscriber.get((function(_this) {
        return function(info) {
          var key, message, messageKey, note, ref, ref1, title, value;
          messageKey = payload.id + "-" + (info.lang || 'int') + "-" + (!!(subOptions != null ? subOptions.ignore_message : void 0));
          if (messageKey in _this.multicastQueue && _this.multicastQueue[messageKey].tokens.length >= 1000) {
            _this.send(messageKey);
          }
          if (messageKey in _this.multicastQueue) {
            _this.multicastQueue[messageKey].tokens.push(info.token);
            return _this.multicastQueue[messageKey].subscribers.push(subscriber);
          } else {
            note = new gcm.Message();
            note.collapseKey = (ref = payload.event) != null ? ref.name : void 0;
            if ((subOptions != null ? subOptions.ignore_message : void 0) !== true) {
              if (title = payload.localizedTitle(info.lang)) {
                note.addData('title', title);
              }
              if (message = payload.localizedMessage(info.lang)) {
                note.addData('message', message);
              }
            }
            ref1 = payload.data;
            for (key in ref1) {
              value = ref1[key];
              note.addData(key, value);
            }
            _this.multicastQueue[messageKey] = {
              tokens: [info.token],
              subscribers: [subscriber],
              note: note
            };
            return _this.multicastQueue[messageKey].timeoutId = setTimeout((function() {
              return _this.send(messageKey);
            }), 500);
          }
        };
      })(this));
    };

    PushServiceGCM.prototype.send = function(messageKey) {
      var message;
      message = this.multicastQueue[messageKey];
      delete this.multicastQueue[messageKey];
      clearTimeout(message.timeoutId);
      return this.driver.send(message.note, message.tokens, 4, (function(_this) {
        return function(err, multicastResult) {
          var i, j, len, ref, ref1, result, results;
          if (multicastResult == null) {
            return (ref = _this.logger) != null ? ref.error("GCM Error: empty response") : void 0;
          } else if ('results' in multicastResult) {
            ref1 = multicastResult.results;
            results = [];
            for (i = j = 0, len = ref1.length; j < len; i = ++j) {
              result = ref1[i];
              results.push(_this.handleResult(result, message.subscribers[i]));
            }
            return results;
          } else {
            return _this.handleResult(multicastResult, message.subscribers[0]);
          }
        };
      })(this));
    };

    PushServiceGCM.prototype.handleResult = function(result, subscriber) {
      var error, ref, ref1;
      if (result.registration_id != null) {
        if (result.registration_id !== subscriber.info.token) {
          return subscriber["delete"]();
        }
      } else if (result.messageId || result.message_id) {

      } else {
        error = result.error || result.errorCode;
        if (error === "NotRegistered" || error === "InvalidRegistration") {
          if ((ref = this.logger) != null) {
            ref.warn("GCM Automatic unregistration for subscriber " + subscriber.id);
          }
          return subscriber["delete"]();
        } else {
          return (ref1 = this.logger) != null ? ref1.error("GCM Error: " + error) : void 0;
        }
      }
    };

    return PushServiceGCM;

  })();

  exports.PushServiceGCM = PushServiceGCM;

}).call(this);
