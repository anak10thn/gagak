
(function() {
  var Event, async, logger,
    hasProp = {}.hasOwnProperty;

  async = require('async');

  logger = require('winston');

  Event = (function() {
    Event.prototype.OPTION_IGNORE_MESSAGE = 1;

    Event.prototype.name_format = /^[a-zA-Z0-9@:._-]{1,100}$/;

    Event.prototype.unicast_format = /^unicast:(.+)$/;

    function Event(redis, name) {
      this.redis = redis;
      this.name = name;
      if (this.redis == null) {
        throw new Error("Missing redis connection");
      }
      if (!Event.prototype.name_format.test(this.name)) {
        throw new Error('Invalid event name ' + this.name);
      }
      this.key = "event:" + this.name;
    }

    Event.prototype.info = function(cb) {
      while (!cb) {
        return;
      }
      return this.redis.multi().hgetall(this.key).zcard(this.key + ":subs").exec((function(_this) {
        return function(err, results) {
          var f, info, key, num, ref, value;
          if (((function() {
            var ref, results1;
            ref = results[0];
            results1 = [];
            for (f in ref) {
              if (!hasProp.call(ref, f)) continue;
              results1.push(f);
            }
            return results1;
          })()).length) {
            info = {
              total: results[1]
            };
            ref = results[0];
            for (key in ref) {
              if (!hasProp.call(ref, key)) continue;
              value = ref[key];
              num = parseInt(value);
              info[key] = num + '' === value ? num : value;
            }
            return cb(info);
          } else {
            return cb(null);
          }
        };
      })(this));
    };

    Event.prototype.unicastSubscriber = function() {
      var Subscriber, matches, subscriberId;
      Subscriber = require('./subscriber').Subscriber;
      if ((matches = Event.prototype.unicast_format.exec(this.name)) != null) {
        subscriberId = matches[1];
        return new Subscriber(this.redis, subscriberId);
      } else {
        return null;
      }
    };

    Event.prototype.exists = function(cb) {
      var subscriber;
      if (this.name === 'broadcast') {
        return cb(true);
      } else if ((subscriber = this.unicastSubscriber()) != null) {
        return subscriber.get((function(_this) {
          return function(fields) {
            return cb(fields != null);
          };
        })(this));
      } else {
        return this.redis.sismember("events", this.name, (function(_this) {
          return function(err, exists) {
            return cb(exists);
          };
        })(this));
      }
    };

    Event.prototype["delete"] = function(cb) {
      var performDelete;
      logger.verbose("Deleting event " + this.name);
      performDelete = (function(_this) {
        return function() {
          return _this.redis.multi().del(_this.key).srem("events", _this.name).exec(function(err, results) {
            if (cb) {
              return cb(results[1] > 0);
            }
          });
        };
      })(this);
      if (this.unicastSubscriber() != null) {
        return performDelete();
      } else {
        return this.forEachSubscribers((function(_this) {
          return function(subscriber, subOptions, doneCb) {
            return subscriber.removeSubscription(_this, doneCb);
          };
        })(this), (function(_this) {
          return function(totalSubscribers) {
            logger.verbose("Unsubscribed " + totalSubscribers + " subscribers from " + _this.name);
            return performDelete();
          };
        })(this));
      }
    };

    Event.prototype.log = function(cb) {
      return this.redis.multi().hincrby(this.key, "total", 1).hset(this.key, "last", Math.round(new Date().getTime() / 1000)).exec((function(_this) {
        return function() {
          if (cb) {
            return cb();
          }
        };
      })(this));
    };

    Event.prototype.forEachSubscribers = function(action, finished) {
      var Subscriber, page, perPage, performAction, subscriber, subscribersKey;
      Subscriber = require('./subscriber').Subscriber;
      if ((subscriber = this.unicastSubscriber()) != null) {
        return action(subscriber, {}, function() {
          if (finished) {
            return finished(1);
          }
        });
      } else {
        if (this.name === 'broadcast') {
          performAction = (function(_this) {
            return function(subscriberId, subOptions) {
              return function(doneCb) {
                return action(new Subscriber(_this.redis, subscriberId), {}, doneCb);
              };
            };
          })(this);
        } else {
          performAction = (function(_this) {
            return function(subscriberId, subOptions) {
              var options;
              options = {
                ignore_message: (subOptions & Event.prototype.OPTION_IGNORE_MESSAGE) !== 0
              };
              return function(doneCb) {
                return action(new Subscriber(_this.redis, subscriberId), options, doneCb);
              };
            };
          })(this);
        }
        subscribersKey = this.name === 'broadcast' ? 'subscribers' : this.key + ":subs";
        perPage = 100;
        page = 0;
        return this.redis.zcard(subscribersKey, (function(_this) {
          return function(err, subcount) {
            var total, totalPages;
            total = subcount;
            totalPages = Math.ceil((subcount * 1.0) / perPage);
            return async.whilst(function() {
              return page < totalPages;
            }, function(chunkDone) {
              return _this.redis.zrange(subscribersKey, Math.max(0, total - ((page + 1) * perPage)), total - (page * perPage) - 1, 'WITHSCORES', function(err, subscriberIdsAndOptions) {
                var i, id, j, len, tasks;
                tasks = [];
                for (i = j = 0, len = subscriberIdsAndOptions.length; j < len; i = j += 2) {
                  id = subscriberIdsAndOptions[i];
                  tasks.push(performAction(id, subscriberIdsAndOptions[i + 1]));
                }
                return async.series(tasks, function() {
                  page++;
                  return chunkDone();
                });
              });
            }, function() {
              if (finished) {
                return finished(subcount);
              }
            });
          };
        })(this));
      }
    };

    return Event;

  })();

  exports.Event = Event;

}).call(this);
