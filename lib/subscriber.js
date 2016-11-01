
(function() {
  var Event, Subscriber, async, crypto, logger,
    hasProp = {}.hasOwnProperty;

  crypto = require('crypto');

  async = require('async');

  Event = require('./event').Event;

  logger = require('winston');

  Subscriber = (function() {
    Subscriber.prototype.getInstanceFromToken = function(redis, proto, token, cb) {
      while (!cb) {
        return;
      }
      if (redis == null) {
        throw new Error("Missing redis connection");
      }
      if (proto == null) {
        throw new Error("Missing mandatory `proto' field");
      }
      if (token == null) {
        throw new Error("Missing mandatory `token' field");
      }
      return redis.hget("tokenmap", proto + ":" + token, (function(_this) {
        return function(err, id) {
          if (id != null) {
            return redis.exists("subscriber:" + id, function(err, exists) {
              if (exists) {
                return cb(new Subscriber(redis, id));
              } else {
                return redis.hdel("tokenmap", proto + ":" + token, function() {
                  return cb(null);
                });
              }
            });
          } else {
            return cb(null);
          }
        };
      })(this));
    };

    Subscriber.prototype.create = function(redis, fields, cb, tentatives) {
      if (tentatives == null) {
        tentatives = 0;
      }
      while (!cb) {
        return;
      }
      if (redis == null) {
        throw new Error("Missing redis connection");
      }
      if ((fields != null ? fields.proto : void 0) == null) {
        throw new Error("Missing mandatory `proto' field");
      }
      if ((fields != null ? fields.token : void 0) == null) {
        throw new Error("Missing mandatory `token' field");
      }
      if (tentatives > 10) {
        throw new Error("Can't find free uniq id");
      }
      return Subscriber.prototype.getInstanceFromToken(redis, fields.proto, fields.token, (function(_this) {
        return function(subscriber) {
          if (subscriber != null) {
            delete fields.token;
            delete fields.proto;
            return subscriber.set(fields, function() {
              var created;
              return cb(subscriber, created = false, tentatives);
            });
          } else {
            return crypto.randomBytes(8, function(ex, buf) {
              var id;
              id = buf.toString('base64').replace(/\=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
              return redis.watch("subscriber:" + id, function() {
                return redis.exists("subscriber:" + id, function(err, exists) {
                  if (exists) {
                    return redis.discard(function() {
                      return Subscriber.prototype.create(redis, fields, cb, tentatives + 1);
                    });
                  } else {
                    fields.created = fields.updated = Math.round(new Date().getTime() / 1000);
                    return redis.multi().hsetnx("tokenmap", fields.proto + ":" + fields.token, id).zadd("subscribers", 0, id).hmset("subscriber:" + id, fields).exec(function(err, results) {
                      var created;
                      if (results === null) {
                        return Subscriber.prototype.create(redis, fields, cb, tentatives + 1);
                      }
                      if (!results[0]) {
                        return redis.del("subscriber:" + id, function() {
                          return Subscriber.prototype.create(redis, fields, cb, tentatives + 1);
                        });
                      } else {
                        return cb(new Subscriber(redis, id), created = true, tentatives);
                      }
                    });
                  }
                });
              });
            });
          }
        };
      })(this));
    };

    function Subscriber(redis1, id1) {
      this.redis = redis1;
      this.id = id1;
      this.info = null;
      this.key = "subscriber:" + this.id;
    }

    Subscriber.prototype["delete"] = function(cb) {
      return this.redis.multi().hmget(this.key, 'proto', 'token').zrange("subscriber:" + this.id + ":evts", 0, -1).exec((function(_this) {
        return function(err, results) {
          var eventName, events, j, len, multi, proto, ref, token;
          ref = results[0], proto = ref[0], token = ref[1];
          events = results[1];
          multi = _this.redis.multi().hdel("tokenmap", proto + ":" + token).zrem("subscribers", _this.id).del(_this.key).del(_this.key + ":evts");
          for (j = 0, len = events.length; j < len; j++) {
            eventName = events[j];
            multi.zrem("event:" + eventName + ":subs", _this.id);
            multi.zcard("event:" + eventName + ":subs");
          }
          return multi.exec(function(err, results) {
            var emptyEvents, i, k, len1;
            _this.info = null;
            emptyEvents = [];
            for (i = k = 0, len1 = events.length; k < len1; i = ++k) {
              eventName = events[i];
              if (results[4 + i + (i * 1) + 1] === 0) {
                emptyEvents.push(new Event(_this.redis, eventName));
              }
            }
            return async.forEach(emptyEvents, (function(evt, done) {
              return evt["delete"](done);
            }), function() {
              if (cb) {
                return cb(results[1] === 1);
              }
            });
          });
        };
      })(this));
    };

    Subscriber.prototype.get = function(cb) {
      while (!cb) {
        return;
      }
      if (this.info != null) {
        return cb(this.info);
      } else {
        return this.redis.hgetall(this.key, (function(_this) {
          return function(err, info) {
            var key, num, ref, ref1, value;
            _this.info = info;
            if (((ref = _this.info) != null ? ref.updated : void 0) != null) {
              ref1 = _this.info;
              for (key in ref1) {
                if (!hasProp.call(ref1, key)) continue;
                value = ref1[key];
                num = parseInt(value);
                _this.info[key] = num + '' === value ? num : value;
              }
              return cb(_this.info);
            } else {
              return cb(_this.info = null);
            }
          };
        })(this));
      }
    };

    Subscriber.prototype.set = function(fieldsAndValues, cb) {
      if (fieldsAndValues.token != null) {
        throw new Error("Can't modify `token` field");
      }
      if (fieldsAndValues.proto != null) {
        throw new Error("Can't modify `proto` field");
      }
      fieldsAndValues.updated = Math.round(new Date().getTime() / 1000);
      return this.redis.multi().zscore("subscribers", this.id).hmset(this.key, fieldsAndValues).exec((function(_this) {
        return function(err, results) {
          _this.info = null;
          if (results && (results[0] != null)) {
            if (cb) {
              return cb(true);
            }
          } else {
            return _this.redis.del(_this.key, function() {
              if (cb) {
                return cb(null);
              }
            });
          }
        };
      })(this));
    };

    Subscriber.prototype.incr = function(field, cb) {
      return this.redis.multi().zscore("subscribers", this.id).hincrby(this.key, field, 1).exec((function(_this) {
        return function(err, results) {
          if (results[0] != null) {
            if (_this.info != null) {
              _this.info[field] = results[1];
            }
            if (cb) {
              return cb(results[1]);
            }
          } else {
            _this.info = null;
            return _this.redis.del(_this.key, function() {
              if (cb) {
                return cb(null);
              }
            });
          }
        };
      })(this));
    };

    Subscriber.prototype.getSubscriptions = function(cb) {
      if (!cb) {
        return;
      }
      return this.redis.multi().zscore("subscribers", this.id).zrange(this.key + ":evts", 0, -1, 'WITHSCORES').exec((function(_this) {
        return function(err, results) {
          var eventName, eventsWithOptions, i, j, len, subscriptions;
          if (results[0] != null) {
            subscriptions = [];
            eventsWithOptions = results[1];
            if (eventsWithOptions != null) {
              for (i = j = 0, len = eventsWithOptions.length; j < len; i = j += 2) {
                eventName = eventsWithOptions[i];
                subscriptions.push({
                  event: new Event(_this.redis, eventName),
                  options: parseInt(eventsWithOptions[i + 1], 10)
                });
              }
            }
            return cb(subscriptions);
          } else {
            return cb(null);
          }
        };
      })(this));
    };

    Subscriber.prototype.getSubscription = function(event, cb) {
      if (!cb) {
        return;
      }
      return this.redis.multi().zscore("subscribers", this.id).zscore(this.key + ":evts", event.name).exec((function(_this) {
        return function(err, results) {
          if ((results[0] != null) && (results[1] != null)) {
            return cb({
              event: event,
              options: parseInt(results[1], 10)
            });
          } else {
            return cb(null);
          }
        };
      })(this));
    };

    Subscriber.prototype.addSubscription = function(event, options, cb) {
      return this.redis.multi().zscore("subscribers", this.id).zadd(this.key + ":evts", options, event.name).zadd(event.key + ":subs", options, this.id).hsetnx(event.key, "created", Math.round(new Date().getTime() / 1000)).sadd("events", event.name).exec((function(_this) {
        return function(err, results) {
          if (results[0] != null) {
            logger.verbose("Registered subscriber " + _this.id + " to event " + event.name);
            if (cb) {
              return cb(results[1] === 1);
            }
          } else {
            _this.redis.multi().del(_this.key + ":evts", event.name).zrem(event.key + ":subs", _this.id).zcard(event.key + ":subs").exec(function(err, results) {
              if (results[2] === 0) {
                return event["delete"]();
              }
            });
            if (cb) {
              return cb(null);
            }
          }
        };
      })(this));
    };

    Subscriber.prototype.removeSubscription = function(event, cb) {
      return this.redis.multi().zscore("subscribers", this.id).zrem(this.key + ":evts", event.name).zrem(event.key + ":subs", this.id).zcard(event.key + ":subs").exec((function(_this) {
        return function(err, results) {
          var wasRemoved;
          if (err) {
            logger.verbose("Error removing Subscription: " + err);
            cb(err);
          }
          if (results[0] != null) {
            wasRemoved = results[1] === 1;
            if (wasRemoved) {
              logger.verbose("Subscriber " + _this.id + " unregistered from event " + event.name);
            }
            if (cb) {
              return cb(null);
            }
          } else {
            logger.verbose("Subscriber " + _this.id + " doesn't exist");
            if (cb) {
              return cb("Not exists");
            }
          }
        };
      })(this));
    };

    return Subscriber;

  })();

  exports.Subscriber = Subscriber;

}).call(this);
