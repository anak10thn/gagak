
(function() {
  var PushServices;

  PushServices = (function() {
    function PushServices() {}

    PushServices.prototype.services = {};

    PushServices.prototype.addService = function(protocol, service) {
      return this.services[protocol] = service;
    };

    PushServices.prototype.getService = function(protocol) {
      return this.services[protocol];
    };

    PushServices.prototype.push = function(subscriber, subOptions, payload, cb) {
      return subscriber.get((function(_this) {
        return function(info) {
          var ref;
          if (info) {
            if ((ref = _this.services[info.proto]) != null) {
              ref.push(subscriber, subOptions, payload);
            }
          }
          if (cb) {
            return cb();
          }
        };
      })(this));
    };

    return PushServices;

  })();

  exports.PushServices = PushServices;

}).call(this);
