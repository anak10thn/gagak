
(function() {
  var PushServiceMPNS, mpns;

  mpns = require('mpns');

  PushServiceMPNS = (function() {
    PushServiceMPNS.prototype.tokenFormat = /^https?:\/\/[a-zA-Z0-9-.]+\.notify\.live\.net\/\S{0,500}$/;

    PushServiceMPNS.prototype.validateToken = function(token) {
      if (PushServiceMPNS.prototype.tokenFormat.test(token)) {
        return token;
      }
    };

    function PushServiceMPNS(conf, logger, tokenResolver) {
      var base;
      this.conf = conf;
      this.logger = logger;
      if ((base = this.conf).type == null) {
        base.type = "toast";
      }
      if (this.conf.type === "tile" && !this.conf.tileMapping) {
        throw new Error("Invalid MPNS configuration: missing `tileMapping` for `tile` type");
      }
    }

    PushServiceMPNS.prototype.push = function(subscriber, subOptions, payload) {
      return subscriber.get((function(_this) {
        return function(info) {
          var e, error, i, key, len, map, message, note, properties, property, ref, ref1, ref2, sender, title, value;
          note = {};
          switch (_this.conf.type) {
            case "toast":
              if ((subOptions != null ? subOptions.ignore_message : void 0) !== true) {
                sender = mpns.sendToast;
                note.text1 = payload.localizedTitle(info.lang) || '';
                note.text2 = payload.localizedMessage(info.lang);
                if (_this.conf.paramTemplate && info.version >= 7.5) {
                  try {
                    note.param = payload.compileTemplate(_this.conf.paramTemplate);
                  } catch (error1) {
                    e = error1;
                    _this.logger.error("Cannot compile MPNS param template: " + e);
                    return;
                  }
                }
              }
              break;
            case "tile":
              map = _this.conf.tileMapping;
              properties = ["id", "title", "count", "backgroundImage", "backBackgroundImage", "backTitle", "backContent"];
              if (info.version >= 8.0) {
                sender = mpns.sendFlipTile;
                properties.push.apply(properties, ["smallBackgroundImage", "wideBackgroundImage", "wideBackContent", "wideBackBackgroundImage"]);
              } else {
                sender = mpns.sendTile;
              }
              for (i = 0, len = properties.length; i < len; i++) {
                property = properties[i];
                if (map[property]) {
                  try {
                    note[property] = payload.compileTemplate(map[property]);
                  } catch (error1) {
                    e = error1;
                  }
                }
              }
              break;
            case "raw":
              sender = mpns.sendRaw;
              if ((subOptions != null ? subOptions.ignore_message : void 0) !== true) {
                if (title = payload.localizedTitle(info.lang)) {
                  note['title'] = title;
                }
                if (message = payload.localizedMessage(info.lang)) {
                  note['message'] = message;
                }
              }
              ref = payload.data;
              for (key in ref) {
                value = ref[key];
                note[key] = value;
              }
              note = {
                payload: JSON.stringify(payload.data)
              };
              break;
            default:
              if ((ref1 = _this.logger) != null) {
                ref1.error("Unsupported MPNS notification type: " + _this.conf.type);
              }
          }
          if (sender) {
            try {
              return sender(info.token, note, function(error, result) {
                var ref2, ref3, ref4;
                if (error) {
                  if (error.shouldDeleteChannel) {
                    if ((ref2 = _this.logger) != null) {
                      ref2.warn("MPNS Automatic unregistration for subscriber " + subscriber.id);
                    }
                    return subscriber["delete"]();
                  } else {
                    return (ref3 = _this.logger) != null ? ref3.error("MPNS Error: (" + error.statusCode + ") " + error.innerError) : void 0;
                  }
                } else {
                  return (ref4 = _this.logger) != null ? ref4.debug("MPNS result: " + (JSON.stringify(result))) : void 0;
                }
              });
            } catch (error1) {
              error = error1;
              return (ref2 = _this.logger) != null ? ref2.error("MPNS Error: " + error) : void 0;
            }
          }
        };
      })(this));
    };

    return PushServiceMPNS;

  })();

  exports.PushServiceMPNS = PushServiceMPNS;

}).call(this);
