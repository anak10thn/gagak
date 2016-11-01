
(function() {
  var Event, Subscriber, createSubscriber, redis, should;

  should = require('should');

  Subscriber = require('../lib/subscriber').Subscriber;

  Event = require('../lib/event').Event;

  redis = require('redis');

  createSubscriber = function(redisClient, proto, token, cb) {
    var e, info;
    info = {
      proto: proto,
      token: token
    };
    try {
      return Subscriber.prototype.create(redisClient, info, cb);
    } catch (error) {
      e = error;
      redisClient.quit();
      throw e;
    }
  };

  describe('Subscriber', function() {
    var xdescribe;
    this.redis = null;
    this.event = null;
    this.subscriber = null;
    this.testEvent = null;
    this.testEvent2 = null;
    xdescribe = (function(_this) {
      return function(title, fn) {
        return describe(title, function() {
          fn();
          before(function(done) {
            _this.redis = redis.createClient();
            return _this.redis.multi().select(1).exec(function() {
              return createSubscriber(_this.redis, 'apns', 'FE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6660', function(subscriber1, created, tentatives) {
                _this.subscriber = subscriber1;
                _this.subscriber.should.be.an["instanceof"](Subscriber);
                created.should.be["true"];
                tentatives.should.equal(0);
                return done();
              });
            });
          });
          return after(function(done) {
            return _this.subscriber["delete"](function() {
              return _this.redis.keys('*', function(err, keys) {
                keys.should.be.empty;
                return done();
              });
            });
          });
        });
      };
    })(this);
    xdescribe('register twice', (function(_this) {
      return function() {
        return it('should not create a second object', function(done) {
          return createSubscriber(_this.redis, 'apns', 'FE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6660', function(subscriber, created, tentatives) {
            subscriber.should.be.an["instanceof"](Subscriber);
            created.should.be["false"];
            tentatives.should.equal(0);
            subscriber.id.should.equal(_this.subscriber.id);
            return done();
          });
        });
      };
    })(this));
    xdescribe('get instance from token', (function(_this) {
      return function() {
        it('should return the instance if already registered', function(done) {
          return Subscriber.prototype.getInstanceFromToken(_this.subscriber.redis, 'apns', 'FE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6660', function(subscriber) {
            subscriber.should.be.an["instanceof"](Subscriber);
            subscriber.id.should.equal(_this.subscriber.id);
            return done();
          });
        });
        return it('should return null if not registered', function(done) {
          return Subscriber.prototype.getInstanceFromToken(_this.subscriber.redis, 'apns', 'FE66489F304DC75B8D6E8200DFF8A456E8DAEACEC428B427E9518741C92C6661', function(subscriber) {
            should.not.exist(subscriber);
            return done();
          });
        });
      };
    })(this));
    xdescribe('defaults', (function(_this) {
      return function() {
        return it('should have some default values', function(done) {
          return _this.subscriber.get(function(fields) {
            should.exist(fields);
            fields.should.have.property('proto');
            fields.should.have.property('token');
            fields.should.have.property('created');
            fields.should.have.property('updated');
            fields.should.not.have.property('badge');
            return done();
          });
        });
      };
    })(this));
    xdescribe('incr()', (function(_this) {
      return function() {
        it('should not increment field of an unexisting subscriber', function(done) {
          var subscriber;
          subscriber = new Subscriber(_this.redis, 'invalidid');
          return subscriber.incr('badge', function(value) {
            should.not.exist(value);
            return done();
          });
        });
        it('should increment unexisting field to 1', function(done) {
          return _this.subscriber.incr('badge', function(value) {
            value.should.equal(1);
            return done();
          });
        });
        return it('should increment an existing field', function(done) {
          return _this.subscriber.incr('badge', function(value) {
            value.should.equal(2);
            return done();
          });
        });
      };
    })(this));
    xdescribe('set()', (function(_this) {
      return function() {
        it('should not edit an unexisting subscriber', function(done) {
          var subscriber;
          subscriber = new Subscriber(_this.subscriber.redis, 'invalidid');
          return subscriber.set({
            lang: 'us'
          }, function(edited) {
            should.not.exist(edited);
            return done();
          });
        });
        return it('should edit an existing subscriber', function(done) {
          return _this.subscriber.set({
            lang: 'us',
            badge: 5
          }, function(edited) {
            edited.should.be["true"];
            return _this.subscriber.get(function(fields) {
              should.exist(fields);
              fields.lang.should.equal('us');
              fields.badge.should.equal(5);
              return done();
            });
          });
        });
      };
    })(this));
    xdescribe('delete()', (function(_this) {
      return function() {
        it('should delete correctly', function(done) {
          return _this.subscriber["delete"](function(deleted) {
            deleted.should.be["true"];
            return done();
          });
        });
        it('should not delete an already deleted subscription', function(done) {
          return _this.subscriber["delete"](function(deleted) {
            deleted.should.be["false"];
            return done();
          });
        });
        return it('should no longer exist', function(done) {
          return _this.subscriber.get(function(fields) {
            should.not.exist(fields);
            return done();
          });
        });
      };
    })(this));
    xdescribe('getSubscriptions()', (function(_this) {
      return function() {
        before(function() {
          _this.testEvent = new Event(_this.redis, 'unit-test' + Math.round(Math.random() * 100000));
          return _this.testEvent2 = new Event(_this.redis, 'unit-test' + Math.round(Math.random() * 100000));
        });
        it('should return null on unexisting subscriber', function(done) {
          var subscriber;
          subscriber = new Subscriber(_this.redis, 'invalidid');
          return subscriber.getSubscriptions(function(subs) {
            should.not.exist(subs);
            return done();
          });
        });
        it('should initially return an empty subscriptions list', function(done) {
          return _this.subscriber.getSubscriptions(function(subs) {
            should.exist(subs);
            subs.should.be.empty;
            return done();
          });
        });
        it('should return a subscription once subscribed', function(done) {
          return _this.subscriber.addSubscription(_this.testEvent, 0, function(added) {
            added.should.be["true"];
            return _this.subscriber.getSubscriptions(function(subs) {
              subs.should.have.length(1);
              subs[0].event.name.should.equal(_this.testEvent.name);
              return done();
            });
          });
        });
        it('should return the added subscription with getSubscription()', function(done) {
          return _this.subscriber.getSubscription(_this.testEvent, function(sub) {
            sub.should.have.property('event');
            sub.event.should.be.an["instanceof"](Event);
            sub.event.name.should.equal(_this.testEvent.name);
            sub.should.have.property('options');
            sub.options.should.equal(0);
            return done();
          });
        });
        return it('should return null with getSubscription() on an unsubscribed event', function(done) {
          return _this.subscriber.getSubscription(_this.testEvent2, function(sub) {
            should.not.exist(sub);
            return done();
          });
        });
      };
    })(this));
    xdescribe('addSubscription()', (function(_this) {
      return function() {
        before(function() {
          return _this.testEvent = new Event(_this.redis, 'unit-test' + Math.round(Math.random() * 100000));
        });
        it('should not add subscription on unexisting subscriber', function(done) {
          var subscriber;
          subscriber = new Subscriber(_this.subscriber.redis, 'invalidid');
          return subscriber.addSubscription(_this.testEvent, 0, function(added) {
            should.not.exist(added);
            return done();
          });
        });
        it('should add subscription correctly', function(done) {
          return _this.subscriber.addSubscription(_this.testEvent, 0, function(added) {
            added.should.be["true"];
            return done();
          });
        });
        return it('should not add an already subscribed event', function(done) {
          return _this.subscriber.addSubscription(_this.testEvent, 0, function(added) {
            added.should.be["false"];
            return done();
          });
        });
      };
    })(this));
    return xdescribe('removeSubscription', (function(_this) {
      return function() {
        before(function() {
          return _this.testEvent = new Event(_this.redis, 'unit-test' + Math.round(Math.random() * 100000));
        });
        after(function(done) {
          return _this.testEvent["delete"](function() {
            return done();
          });
        });
        it('should not remove subscription on an unexisting subscription', function(done) {
          var subscriber;
          subscriber = new Subscriber(_this.subscriber.redis, 'invalidid');
          return subscriber.removeSubscription(_this.testEvent, function(errDeleting) {
            should.exist(errDeleting);
            return done();
          });
        });
        it('should not remove an unsubscribed event', function(done) {
          return _this.subscriber.removeSubscription(_this.testEvent, function(errDeleting) {
            should.not.exist(errDeleting);
            return done();
          });
        });
        it('should remove an subscribed event correctly', function(done) {
          return _this.subscriber.addSubscription(_this.testEvent, 0, function(added) {
            added.should.be["true"];
            return _this.subscriber.removeSubscription(_this.testEvent, function(errDeleting) {
              should.not.exist(errDeleting);
              return done();
            });
          });
        });
        return it('should not remove an already removed subscription', function(done) {
          return _this.subscriber.removeSubscription(_this.testEvent, function(errDeleting) {
            should.not.exist(errDeleting);
            return done();
          });
        });
      };
    })(this));
  });

}).call(this);
