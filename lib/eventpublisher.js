
(function() {
  var EventPublisher, Payload, events, logger,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  events = require('events');

  Payload = require('./payload').Payload;

  logger = require('winston');

  EventPublisher = (function(superClass) {
    extend(EventPublisher, superClass);

    function EventPublisher(pushServices) {
      this.pushServices = pushServices;
    }

    EventPublisher.prototype.publish = function(event, data, cb) {
      var e, payload;
      try {
        payload = new Payload(data);
        payload.event = event;
      } catch (error) {
        e = error;
        logger.error('Invalid payload ' + e);
        if (cb) {
          cb(-1);
        }
        return;
      }
      this.emit(event.name, event, payload);
      return event.exists((function(_this) {
        return function(exists) {
          var protoCounts;
          if (!exists) {
            logger.verbose("Tried to publish to a non-existing event " + event.name);
            if (cb) {
              cb(0);
            }
            return;
          }
          try {
            payload.compile();
          } catch (error) {
            e = error;
            logger.error("Invalid payload, template doesn't compile");
            if (cb) {
              cb(-1);
            }
            return;
          }
          logger.verbose("Pushing message for event " + event.name);
          logger.silly("data = " + (JSON.stringify(data)));
          logger.silly('Title: ' + payload.localizedTitle('en'));
          logger.silly(payload.localizedMessage('en'));
          protoCounts = {};
          return event.forEachSubscribers(function(subscriber, subOptions, done) {
            subscriber.get(function(info) {
              if ((info != null ? info.proto : void 0) != null) {
                if (protoCounts[info.proto] != null) {
                  return protoCounts[info.proto] += 1;
                } else {
                  return protoCounts[info.proto] = 1;
                }
              }
            });
            return _this.pushServices.push(subscriber, subOptions, payload, done);
          }, function(totalSubscribers) {
            var count, proto;
            logger.verbose("Pushed to " + totalSubscribers + " subscribers");
            for (proto in protoCounts) {
              count = protoCounts[proto];
              logger.verbose(count + " " + proto + " subscribers");
            }
            if (totalSubscribers > 0) {
              return event.log(function() {
                if (cb) {
                  return cb(totalSubscribers);
                }
              });
            } else {
              return event["delete"](function() {
                if (cb) {
                  return cb(0);
                }
              });
            }
          });
        };
      })(this));
    };

    return EventPublisher;

  })(events.EventEmitter);

  exports.EventPublisher = EventPublisher;

}).call(this);
