
(function() {
  var PushServiceWNS, wns;

  wns = require('wns');

  PushServiceWNS = (function() {
    PushServiceWNS.prototype.tokenFormat = /^https?:\/\/[a-zA-Z0-9-.]+\.notify\.windows\.com\/\S{0,500}$/;

    PushServiceWNS.prototype.validateToken = function(token) {
      if (PushServiceWNS.prototype.tokenFormat.test(token)) {
        return token;
      }
    };

    function PushServiceWNS(conf, logger, tokenResolver) {
      var base;
      this.conf = conf;
      this.logger = logger;
      if ((base = this.conf).type == null) {
        base.type = "toast";
      }
      if (this.conf.type === "tile" && !this.conf.tileMapping) {
        throw new Error("Invalid WNS configuration: missing `tileMapping` for `tile` type");
      }
    }

    PushServiceWNS.prototype.push = function(subscriber, subOptions, payload) {
      return subscriber.get((function(_this) {
        return function(info) {
          var e, error, key, launch, message, note, options, ref, ref1, ref2, ref3, ref4, ref5, ref6, sender, title, value;
          note = {};
          switch (_this.conf.type) {
            case "toast":
              if ((subOptions != null ? subOptions.ignore_message : void 0) !== true) {
                sender = wns.sendToastText02;
                note.text1 = payload.localizedTitle(info.lang) || '';
                note.text2 = payload.localizedMessage(info.lang);
                if (_this.conf.launchTemplate && info.version >= 7.5) {
                  try {
                    launch = payload.compileTemplate(_this.conf.launchTemplate);
                    if ((ref = _this.logger) != null) {
                      ref.silly("Launch: " + launch);
                    }
                  } catch (error1) {
                    e = error1;
                    if ((ref1 = _this.logger) != null) {
                      ref1.error("Cannot compile WNS param template: " + e);
                    }
                    return;
                  }
                }
              }
              break;
            case "tile":
              if ((ref2 = _this.logger) != null) {
                ref2.error("Not implemented: tile notifications");
              }
              break;
            case "raw":
              sender = wns.sendRaw;
              if ((subOptions != null ? subOptions.ignore_message : void 0) !== true) {
                if (title = payload.localizedTitle(info.lang)) {
                  note['title'] = title;
                }
                if (message = payload.localizedMessage(info.lang)) {
                  note['message'] = message;
                }
              }
              ref3 = payload.data;
              for (key in ref3) {
                value = ref3[key];
                note[key] = value;
              }
              note = {
                payload: JSON.stringify(payload.data)
              };
              break;
            default:
              if ((ref4 = _this.logger) != null) {
                ref4.error("Unsupported WNS notification type: " + _this.conf.type);
              }
          }
          if (sender) {
            try {
              options = {
                client_id: _this.conf.client_id,
                client_secret: _this.conf.client_secret
              };
              if (launch != null) {
                options["launch"] = launch;
              }
              if ((ref5 = _this.logger) != null) {
                ref5.silly("WNS client URL: " + info.token);
              }
              return sender(info.token, note, options, function(error, result) {
                var ref6, ref7;
                if (error) {
                  if (error.shouldDeleteChannel) {
                    if ((ref6 = _this.logger) != null) {
                      ref6.warn("WNS Automatic unregistration for subscriber " + subscriber.id);
                    }
                    return subscriber["delete"]();
                  }
                } else {
                  return (ref7 = _this.logger) != null ? ref7.debug("WNS result: " + (JSON.stringify(result))) : void 0;
                }
              });
            } catch (error1) {
              error = error1;
              return (ref6 = _this.logger) != null ? ref6.error("WNS Error: " + error) : void 0;
            }
          }
        };
      })(this));
    };

    return PushServiceWNS;

  })();

  exports.PushServiceWNS = PushServiceWNS;

}).call(this);
