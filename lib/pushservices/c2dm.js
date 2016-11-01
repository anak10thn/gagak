
(function() {
  var PushServiceC2DM, async, c2dm;

  async = require('async');

  c2dm = require('c2dm');

  PushServiceC2DM = (function() {
    PushServiceC2DM.prototype.tokenFormat = /^[a-zA-Z0-9_-]+$/;

    PushServiceC2DM.prototype.validateToken = function(token) {
      if (PushServiceC2DM.prototype.tokenFormat.test(token)) {
        return token;
      }
    };

    function PushServiceC2DM(conf, logger, tokenResolver) {
      this.logger = logger;
      if (conf.concurrency == null) {
        conf.concurrency = 10;
      }
      conf.keepAlive = true;
      this.driver = new c2dm.C2DM(conf);
      this.driver.login((function(_this) {
        return function(err, token) {
          var i, len, queuedTasks, ref, results, task;
          if (err) {
            throw Error(err);
          }
          ref = [
            _this.queue, async.queue((function() {
              return _this._pushTask.apply(_this, arguments);
            }), conf.concurrency)
          ], queuedTasks = ref[0], _this.queue = ref[1];
          results = [];
          for (i = 0, len = queuedTasks.length; i < len; i++) {
            task = queuedTasks[i];
            results.push(_this.queue.push(task));
          }
          return results;
        };
      })(this));
      this.queue = [];
    }

    PushServiceC2DM.prototype.push = function(subscriber, subOptions, payload) {
      return this.queue.push({
        subscriber: subscriber,
        subOptions: subOptions,
        payload: payload
      });
    };

    PushServiceC2DM.prototype._pushTask = function(task, done) {
      return task.subscriber.get((function(_this) {
        return function(info) {
          var key, message, note, ref, ref1, ref2, title, value;
          note = {
            registration_id: info.token,
            collapse_key: (ref = task.payload.event) != null ? ref.name : void 0
          };
          if (((ref1 = task.subOptions) != null ? ref1.ignore_message : void 0) !== true) {
            if (title = task.payload.localizedTitle(info.lang)) {
              note['data.title'] = title;
            }
            if (message = task.payload.localizedMessage(info.lang)) {
              note['data.message'] = message;
            }
          }
          ref2 = task.payload.data;
          for (key in ref2) {
            value = ref2[key];
            note["data." + key] = value;
          }
          return _this.driver.send(note, function(err, msgid) {
            var ref3, ref4;
            done();
            if (err === 'InvalidRegistration' || err === 'NotRegistered') {
              if ((ref3 = _this.logger) != null) {
                ref3.warn("C2DM Automatic unregistration for subscriber " + task.subscriber.id);
              }
              return task.subscriber["delete"]();
            } else if (err) {
              return (ref4 = _this.logger) != null ? ref4.error("C2DM Error " + err + " for subscriber " + task.subscriber.id) : void 0;
            }
          });
        };
      })(this));
    };

    return PushServiceC2DM;

  })();

  exports.PushServiceC2DM = PushServiceC2DM;

}).call(this);
