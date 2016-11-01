
(function() {
  var policyFile;

  policyFile = '<?xml version="1.0"?>' + '<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">' + '<cross-domain-policy>' + '<site-control permitted-cross-domain-policies="master-only"/>' + '<allow-access-from domain="*" secure="false"/>' + '<allow-http-request-headers-from domain="*" headers="Accept"/>' + '</cross-domain-policy>';

  exports.setup = function(app, authorize, eventPublisher) {
    app.get('/crossdomain.xml', function(req, res) {
      res.set('Content-Type', 'application/xml');
      return res.send(policyFile);
    });
    app.options('/subscribe', authorize('listen'), function(req, res) {
      res.set({
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '86400'
      });
      return res.end();
    });
    return app.get('/subscribe', authorize('listen'), function(req, res) {
      var antiIdleInterval, eventName, eventNames, i, len, ref, results, sendEvent;
      if (!req.accepts('text/event-stream')) {
        res.send(406);
        return;
      }
      if (typeof req.query.events !== 'string') {
        res.send(400);
        return;
      }
      eventNames = req.query.events.split(' ');
      req.socket.setTimeout(0x7FFFFFFF);
      req.socket.setNoDelay(true);
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Connection': 'close'
      });
      res.write('\n');
      if (((ref = req.get('User-Agent')) != null ? ref.indexOf('MSIE') : void 0) !== -1) {
        res.write(new Array(2048).join('\n'));
      }
      sendEvent = function(event, payload) {
        var data;
        data = {
          event: event.name,
          title: payload.title,
          message: payload.msg,
          data: payload.data
        };
        return res.write("data: " + JSON.stringify(data) + "\n\n");
      };
      antiIdleInterval = setInterval(function() {
        return res.write("\n");
      }, 10000);
      res.socket.on('close', (function(_this) {
        return function() {
          var eventName, i, len, results;
          clearInterval(antiIdleInterval);
          results = [];
          for (i = 0, len = eventNames.length; i < len; i++) {
            eventName = eventNames[i];
            results.push(eventPublisher.removeListener(eventName, sendEvent));
          }
          return results;
        };
      })(this));
      results = [];
      for (i = 0, len = eventNames.length; i < len; i++) {
        eventName = eventNames[i];
        results.push(eventPublisher.addListener(eventName, sendEvent));
      }
      return results;
    });
  };

}).call(this);
