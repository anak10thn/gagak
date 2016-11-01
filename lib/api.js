
(function() {
  var async, filterFields, logger, util,
    hasProp = {}.hasOwnProperty;

  async = require('async');

  util = require('util');

  logger = require('winston');

  filterFields = function(params) {
    var fields, key, val;
    fields = {};
    for (key in params) {
      if (!hasProp.call(params, key)) continue;
      val = params[key];
      if (key === 'proto' || key === 'token' || key === 'lang' || key === 'badge' || key === 'version' || key === 'category' || key === 'contentAvailable') {
        fields[key] = val;
      }
    }
    return fields;
  };

  exports.setupRestApi = function(app, createSubscriber, getEventFromId, authorize, testSubscriber, eventPublisher, checkStatus) {
    if (authorize == null) {
      authorize = function(realm) {};
    }
    app.post('/subscribers', authorize('register'), function(req, res) {
      var error, fields;
      logger.verbose("Registering subscriber: " + JSON.stringify(req.body));
      try {
        fields = filterFields(req.body);
        return createSubscriber(fields, function(subscriber, created) {
          return subscriber.get(function(info) {
            info.id = subscriber.id;
            res.header('Location', "/subscriber/" + subscriber.id);
            return res.json(info, created ? 201 : 200);
          });
        });
      } catch (error1) {
        error = error1;
        logger.error("Creating subscriber failed: " + error.message);
        return res.json({
          error: error.message
        }, 400);
      }
    });
    app.get('/subscriber/:subscriber_id', authorize('register'), function(req, res) {
      return req.subscriber.get(function(fields) {
        if (fields == null) {
          logger.error("No subscriber " + req.subscriber.id);
        } else {
          logger.verbose(("Subscriber " + req.subscriber.id + " info: ") + JSON.stringify(fields));
        }
        return res.json(fields, fields != null ? 200 : 404);
      });
    });
    app.post('/subscriber/:subscriber_id', authorize('register'), function(req, res) {
      var fields;
      logger.verbose(("Setting new properties for " + req.subscriber.id + ": ") + JSON.stringify(req.body));
      fields = filterFields(req.body);
      return req.subscriber.set(fields, function(edited) {
        if (!edited) {
          logger.error("No subscriber " + req.subscriber.id);
        }
        return res.send(edited ? 204 : 404);
      });
    });
    app["delete"]('/subscriber/:subscriber_id', authorize('register'), function(req, res) {
      return req.subscriber["delete"](function(deleted) {
        if (!deleted) {
          logger.error("No subscriber " + req.subscriber.id);
        }
        return res.send(deleted ? 204 : 404);
      });
    });
    app.post('/subscriber/:subscriber_id/test', authorize('register'), function(req, res) {
      testSubscriber(req.subscriber);
      return res.send(201);
    });
    app.get('/subscriber/:subscriber_id/subscriptions', authorize('register'), function(req, res) {
      return req.subscriber.getSubscriptions(function(subs) {
        var i, len, sub, subsAndOptions;
        if (subs != null) {
          subsAndOptions = {};
          for (i = 0, len = subs.length; i < len; i++) {
            sub = subs[i];
            subsAndOptions[sub.event.name] = {
              ignore_message: (sub.options & sub.event.OPTION_IGNORE_MESSAGE) !== 0
            };
          }
          logger.verbose(("Status of " + req.subscriber.id + ": ") + JSON.stringify(subsAndOptions));
          return res.json(subsAndOptions);
        } else {
          logger.error("No subscriber " + req.subscriber.id);
          return res.send(404);
        }
      });
    });
    app.post('/subscriber/:subscriber_id/subscriptions', authorize('register'), function(req, res) {
      var error, event, eventId, options, optionsDict, ref, subsToAdd;
      subsToAdd = req.body;
      logger.verbose(("Setting subscriptions for " + req.subscriber.id + ": ") + JSON.stringify(req.body));
      ref = req.body;
      for (eventId in ref) {
        optionsDict = ref[eventId];
        try {
          event = getEventFromId(eventId);
          options = 0;
          if ((optionsDict != null) && typeof optionsDict === 'object' && optionsDict.ignore_message) {
            options |= event.OPTION_IGNORE_MESSAGE;
          }
          subsToAdd[event.name] = {
            event: event,
            options: options
          };
        } catch (error1) {
          error = error1;
          logger.error("Failed to set subscriptions for " + req.subscriber.id + ": " + error.message);
          res.json({
            error: error.message
          }, 400);
          return;
        }
      }
      return req.subscriber.getSubscriptions(function(subs) {
        var eventName, i, len, sub, subToAdd, tasks;
        if (subs == null) {
          logger.error("No subscriber " + req.subscriber.id);
          res.send(404);
          return;
        }
        tasks = [];
        for (i = 0, len = subs.length; i < len; i++) {
          sub = subs[i];
          if (sub.event.name in subsToAdd) {
            subToAdd = subsToAdd[sub.event.name];
            if (subToAdd.options !== sub.options) {
              tasks.push(['set', subToAdd.event, subToAdd.options]);
            }
            delete subsToAdd[sub.event.name];
          } else {
            tasks.push(['del', sub.event, 0]);
          }
        }
        for (eventName in subsToAdd) {
          sub = subsToAdd[eventName];
          tasks.push(['add', sub.event, sub.options]);
        }
        return async.every(tasks, function(task, callback) {
          var action;
          action = task[0], event = task[1], options = task[2];
          if (action === 'add') {
            return req.subscriber.addSubscription(event, options, function(added) {
              return callback(added);
            });
          } else if (action === 'del') {
            return req.subscriber.removeSubscription(event, function(deleted) {
              return callback(deleted);
            });
          } else if (action === 'set') {
            return req.subscriber.addSubscription(event, options, function(added) {
              return callback(!added);
            });
          }
        }, function(result) {
          if (!result) {
            logger.error("Failed to set properties for " + req.subscriber.id);
          }
          return res.send(result ? 204 : 400);
        });
      });
    });
    app.get('/subscriber/:subscriber_id/subscriptions/:event_id', authorize('register'), function(req, res) {
      return req.subscriber.getSubscription(req.event, function(options) {
        if (options != null) {
          return res.json({
            ignore_message: (options & req.event.OPTION_IGNORE_MESSAGE) !== 0
          });
        } else {
          logger.error("No subscriber " + req.subscriber.id);
          return res.send(404);
        }
      });
    });
    app.post('/subscriber/:subscriber_id/subscriptions/:event_id', authorize('register'), function(req, res) {
      var options;
      options = 0;
      if (parseInt(req.body.ignore_message)) {
        options |= req.event.OPTION_IGNORE_MESSAGE;
      }
      return req.subscriber.addSubscription(req.event, options, function(added) {
        if (added != null) {
          return res.send(added ? 201 : 204);
        } else {
          logger.error("No subscriber " + req.subscriber.id);
          return res.send(404);
        }
      });
    });
    app["delete"]('/subscriber/:subscriber_id/subscriptions/:event_id', authorize('register'), function(req, res) {
      return req.subscriber.removeSubscription(req.event, function(errorDeleting) {
        if (errorDeleting != null) {
          logger.error("No subscriber " + req.subscriber.id + " or not subscribed to " + req.event.name);
        }
        return res.send(errorDeleting ? 404 : 204);
      });
    });
    app.get('/event/:event_id', authorize('register'), function(req, res) {
      return req.event.info(function(info) {
        if (info == null) {
          logger.error("No event " + req.event.name);
        } else {
          logger.verbose(("Event " + req.event.name + " info: ") + JSON.stringify(info));
        }
        return res.json(info, info != null ? 200 : 404);
      });
    });
    app.post('/event/:event_id', authorize('publish'), function(req, res) {
      res.send(204);
      return eventPublisher.publish(req.event, req.body);
    });
    app["delete"]('/event/:event_id', authorize('publish'), function(req, res) {
      return req.event["delete"](function(deleted) {
        if (!deleted) {
          logger.error("No event " + req.event.name);
        }
        if (deleted) {
          return res.send(204);
        } else {
          return res.send(404);
        }
      });
    });
    return app.get('/status', authorize('register'), function(req, res) {
      if (checkStatus()) {
        return res.send(204);
      } else {
        return res.send(503);
      }
    });
  };

}).call(this);
