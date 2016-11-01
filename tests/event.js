
(function() {
  var Event, EventPublisher, PushServiceFake, PushServices, Subscriber, async, createSubscriber, redis, should;

  should = require('should');

  async = require('async');

  redis = require('redis');

  Subscriber = require('../lib/subscriber').Subscriber;

  Event = require('../lib/event').Event;

  EventPublisher = require('../lib/eventpublisher').EventPublisher;

  PushServices = require('../lib/pushservices').PushServices;

  PushServiceFake = (function() {
    function PushServiceFake() {}

    PushServiceFake.prototype.total = 0;

    PushServiceFake.prototype.validateToken = function(token) {
      return token;
    };

    PushServiceFake.prototype.push = function(subscriber, subOptions, info, payload) {
      return PushServiceFake.prototype.total++;
    };

    return PushServiceFake;

  })();

  createSubscriber = function(redis, cb) {
    var chars, i, j, token;
    chars = '0123456789ABCDEF';
    token = '';
    for (i = j = 1; j <= 64; i = ++j) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return Subscriber.prototype.create(redis, {
      proto: 'apns',
      token: token
    }, cb);
  };

  describe('Event', function() {
    this.redis = null;
    this.event = null;
    this.publisher = null;
    this.subscriber = null;
    beforeEach((function(_this) {
      return function(done) {
        _this.redis = redis.createClient();
        return _this.redis.multi().select(1).flushdb().exec(function() {
          var services;
          services = new PushServices();
          services.addService('apns', new PushServiceFake());
          _this.publisher = new EventPublisher(services);
          _this.event = new Event(_this.redis, 'unit-test' + Math.round(Math.random() * 100000));
          return done();
        });
      };
    })(this));
    afterEach((function(_this) {
      return function(done) {
        return _this.event["delete"](function() {
          if (_this.subscriber != null) {
            return _this.subscriber["delete"](function() {
              return _this.redis.keys('*', function(err, keys) {
                _this.redis.quit();
                keys.should.be.empty;
                _this.subscriber = null;
                return done();
              });
            });
          } else {
            return _this.redis.keys('*', function(err, keys) {
              keys.should.be.empty;
              return done();
            });
          }
        });
      };
    })(this));
    describe('forEachSubscribers()', (function(_this) {
      return function() {
        it('should iterate of multiple pages of subscribers', function(doneAll) {
          var subscribers, totalSubscribers;
          totalSubscribers = 410;
          subscribers = [];
          return async.whilst(function() {
            return subscribers.length < totalSubscribers;
          }, function(doneCreatingSubscriber) {
            return createSubscriber(_this.redis, function(subscriber) {
              subscribers.push(subscriber);
              return subscriber.addSubscription(_this.event, 0, function(added) {
                return doneCreatingSubscriber();
              });
            });
          }, function() {
            var j, len, subscriber, unhandledSubscribers;
            subscribers.length.should.equal(totalSubscribers);
            unhandledSubscribers = {};
            for (j = 0, len = subscribers.length; j < len; j++) {
              subscriber = subscribers[j];
              unhandledSubscribers[subscriber.id] = true;
            }
            return _this.event.forEachSubscribers(function(subscriber, subOptions, done) {
              unhandledSubscribers[subscriber.id].should.be["true"];
              delete unhandledSubscribers[subscriber.id];
              return done();
            }, function(total) {
              var i;
              total.should.equal(totalSubscribers);
              ((function() {
                var results;
                results = [];
                for (i in unhandledSubscribers) {
                  results.push(i);
                }
                return results;
              })()).length.should.equal(0);
              return async.whilst(function() {
                return subscribers.length > 0;
              }, function(doneCleaningSubscribers) {
                return subscribers.pop()["delete"](function() {
                  return doneCleaningSubscribers();
                });
              }, function() {
                return doneAll();
              });
            });
          });
        });
        return it('should send a broadcast event to all subscribers', function(doneAll) {
          var broadcastEvent, subscribers, totalSubscribers;
          broadcastEvent = new Event(_this.redis, 'broadcast');
          totalSubscribers = 410;
          subscribers = [];
          return async.whilst(function() {
            return subscribers.length < totalSubscribers;
          }, function(doneCreatingSubscriber) {
            return createSubscriber(_this.redis, function(subscriber) {
              subscribers.push(subscriber);
              return doneCreatingSubscriber();
            });
          }, function() {
            var j, len, subscriber, unhandledSubscribers;
            subscribers.length.should.equal(totalSubscribers);
            unhandledSubscribers = {};
            for (j = 0, len = subscribers.length; j < len; j++) {
              subscriber = subscribers[j];
              unhandledSubscribers[subscriber.id] = true;
            }
            return broadcastEvent.forEachSubscribers(function(subscriber, subOptions, done) {
              unhandledSubscribers[subscriber.id].should.be["true"];
              delete unhandledSubscribers[subscriber.id];
              return done();
            }, function(total) {
              var i;
              total.should.equal(totalSubscribers);
              ((function() {
                var results;
                results = [];
                for (i in unhandledSubscribers) {
                  results.push(i);
                }
                return results;
              })()).length.should.equal(0);
              return async.whilst(function() {
                return subscribers.length > 0;
              }, function(doneCleaningSubscribers) {
                return subscribers.pop()["delete"](function() {
                  return doneCleaningSubscribers();
                });
              }, function() {
                return doneAll();
              });
            });
          });
        });
      };
    })(this));
    describe('publish()', (function(_this) {
      return function() {
        it('should not push anything if no subscribers', function(done) {
          PushServiceFake.prototype.total = 0;
          return _this.publisher.publish(_this.event, {
            msg: 'test'
          }, function(total) {
            PushServiceFake.prototype.total.should.equal(0);
            total.should.equal(0);
            return done();
          });
        });
        it('should push to one subscriber', function(done) {
          PushServiceFake.prototype.total = 0;
          return createSubscriber(_this.redis, function(subscriber1) {
            _this.subscriber = subscriber1;
            return _this.subscriber.addSubscription(_this.event, 0, function(added) {
              added.should.be["true"];
              PushServiceFake.prototype.total.should.equal(0);
              return _this.publisher.publish(_this.event, {
                msg: 'test'
              }, function(total) {
                PushServiceFake.prototype.total.should.equal(1);
                total.should.equal(1);
                return done();
              });
            });
          });
        });
        return it('should push unicast event to subscriber', function(done) {
          PushServiceFake.prototype.total = 0;
          return createSubscriber(_this.redis, function(subscriber1) {
            var unicastEvent;
            _this.subscriber = subscriber1;
            unicastEvent = new Event(_this.redis, "unicast:" + _this.subscriber.id);
            return _this.publisher.publish(unicastEvent, {
              msg: 'test'
            }, function(total) {
              PushServiceFake.prototype.total.should.equal(1);
              total.should.equal(1);
              return unicastEvent["delete"](function() {
                return done();
              });
            });
          });
        });
      };
    })(this));
    describe('unicastSubscriber', (function(_this) {
      return function() {
        return it('should provide subscriber for unicast event', function(doneAll) {
          var subscribers, totalSubscribers;
          totalSubscribers = 410;
          subscribers = [];
          return async.whilst(function() {
            return subscribers.length < totalSubscribers;
          }, function(doneCreatingSubscriber) {
            return createSubscriber(_this.redis, function(subscriber) {
              var event;
              subscribers.push(subscriber);
              event = new Event(_this.redis, "unicast:" + subscriber.id);
              event.unicastSubscriber().id.should.equal(subscriber.id);
              return doneCreatingSubscriber();
            });
          }, function() {
            return async.whilst(function() {
              return subscribers.length > 0;
            }, function(doneCleaningSubscribers) {
              return subscribers.pop()["delete"](function() {
                return doneCleaningSubscribers();
              });
            }, function() {
              return doneAll();
            });
          });
        });
      };
    })(this));
    describe('stats', (function(_this) {
      return function() {
        return it('should increment increment total field on new subscription', function(done) {
          return _this.publisher.publish(_this.event, {
            msg: 'test'
          }, function() {
            return _this.event.info(function(info) {
              should.not.exist(info);
              return createSubscriber(_this.redis, function(subscriber1) {
                _this.subscriber = subscriber1;
                return _this.subscriber.addSubscription(_this.event, 0, function(added) {
                  added.should.be["true"];
                  return _this.publisher.publish(_this.event, {
                    msg: 'test'
                  }, function() {
                    return _this.event.info(function(info) {
                      should.exist(info);
                      if (info != null) {
                        info.total.should.equal(1);
                      }
                      return done();
                    });
                  });
                });
              });
            });
          });
        });
      };
    })(this));
    return describe('delete()', (function(_this) {
      return function() {
        return it('should unsubscribe subscribers', function(done) {
          return createSubscriber(_this.redis, function(subscriber1) {
            _this.subscriber = subscriber1;
            return _this.subscriber.addSubscription(_this.event, 0, function(added) {
              added.should.be["true"];
              return _this.event["delete"](function() {
                return _this.subscriber.getSubscriptions(function(subcriptions) {
                  subcriptions.should.be.empty;
                  return done();
                });
              });
            });
          });
        });
      };
    })(this));
  });

}).call(this);
